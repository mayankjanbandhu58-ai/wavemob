"""
Prediction Routes

POST /predict — Single image analysis
POST /batch-predict — Multiple image analysis
"""

import io
import logging
import time
from typing import List

import numpy as np
import torch
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, BackgroundTasks
from fastapi.responses import JSONResponse

from app.config import DISEASE_LABELS, MC_DROPOUT_PASSES
from app.state import app_state
from app.pipeline.gradcam import heatmap_to_base64
from app.pipeline.llm_service import generate_clinical_summary, generate_ai_response_sync, generate_patient_summary
from app.pipeline.report_generator import generate_report
from app.pipeline.uncertainty import classify_uncertainty, mc_dropout_inference
from app.utils.image_utils import (
    image_to_base64,
    load_image,
    preprocess_for_inference,
    validate_image,
)

logger = logging.getLogger("wavelength.routes.predict")

router = APIRouter()


@router.post("/predict")
async def predict(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    patient_name: str = Form(None),
    patient_age: str = Form(None),
    patient_gender: str = Form(None),
    patient_phone: str = Form(None),
    patient_address: str = Form(None),
    symptoms: str = Form(None),
    smoking_history: str = Form(None),
):
    """
    Analyze a single chest X-ray image.

    Full pipeline:
    1. Validate input image
    2. Segment lungs (if model available)
    3. Run ensemble inference
    4. Calibrate probabilities
    5. Estimate uncertainty
    6. Generate Grad-CAM heatmap
    7. Compute risk score
    8. Generate structured report

    Returns JSON with probabilities, risk, uncertainty, heatmaps, and report.
    """
    start_time = time.time()

    # Step 1: Validate input
    image_bytes = await file.read()
    is_valid, error_msg = validate_image(image_bytes)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    try:
        # Load image
        image = load_image(image_bytes)
        original_base64 = image_to_base64(image)

        # Step 2: Lung segmentation
        segmentation_overlay_b64 = None
        try:
            from app.pipeline.segmentation import (
                apply_lung_mask,
                create_segmentation_overlay,
                segment_lungs,
            )
            mask = segment_lungs(image, device="cuda")
            masked_image = apply_lung_mask(image, mask)
            seg_overlay = create_segmentation_overlay(image, mask)
            segmentation_overlay_b64 = image_to_base64(seg_overlay)
        except Exception as e:
            logger.warning(f"Segmentation skipped: {e}")
            masked_image = image

        # Step 3: Preprocess
        input_tensor = preprocess_for_inference(masked_image)

        # Step 4: Ensemble inference
        if app_state.onnx_runner and len(app_state.onnx_runner.loaded_models) > 0:
            # ONNX inference path (production)
            input_np = input_tensor.numpy()
            predictions = app_state.onnx_runner.predict_ensemble(input_np)

            if app_state.ensemble:
                probabilities = app_state.ensemble.combine(predictions)
            else:
                probabilities = np.mean(list(predictions.values()), axis=0)

        elif app_state.pytorch_models:
            # PyTorch fallback path (development / pre-export)
            device = app_state.device
            input_gpu = input_tensor.to(device)
            predictions = {}

            with torch.no_grad():
                for name, model in app_state.pytorch_models.items():
                    logits = model(input_gpu)
                    probs = torch.sigmoid(logits).cpu().numpy().squeeze()
                    predictions[name] = probs

            if app_state.ensemble:
                probabilities = app_state.ensemble.combine(predictions)
            elif len(predictions) > 1:
                probabilities = np.mean(list(predictions.values()), axis=0)
            else:
                probabilities = list(predictions.values())[0]
        else:
            raise HTTPException(
                status_code=503,
                detail="No models loaded. Please run training first."
            )

        # Step 5: Calibrate
        calibrated = False
        if app_state.calibrator:
            logits_tensor = torch.tensor(np.log(probabilities / (1 - probabilities + 1e-8)))
            probabilities = app_state.calibrator.calibrate(logits_tensor)
            calibrated = True

        # Step 6: Uncertainty estimation
        # Note: MC Dropout needs PyTorch models, not ONNX
        # For production, we use ensemble variance as a proxy
        uncertainty_data = {
            "overall_uncertainty": "low",
            "mean_variance": 0.0,
            "per_disease": [
                {"disease": d, "variance": 0.0, "is_uncertain": False}
                for d in DISEASE_LABELS
            ],
        }

        # If multiple models, use inter-model disagreement as uncertainty proxy
        if app_state.onnx_runner and len(app_state.onnx_runner.loaded_models) > 1:
            model_preds = list(predictions.values())
            variance = np.var(model_preds, axis=0)
            uncertainty_data = classify_uncertainty(
                variance, threshold=0.15, disease_labels=DISEASE_LABELS
            )

        # Step 7: Grad-CAM Explainability
        heatmap_b64 = None
        try:
            top_class_idx = int(np.argmax(probabilities))
            model = app_state.pytorch_models.get("densenet121")
            
            # For Grad-CAM, we need gradients, so the tensor requires grad
            if model and probabilities[top_class_idx] > 0.05:
                from app.pipeline.gradcam import GradCAMExplainer, heatmap_to_base64
                
                target_layer = model.get_last_conv_layer()
                explainer = GradCAMExplainer(model, target_layer)
                
                # We must enable gradient tracking for the input tensor specifically for Grad-CAM
                # We clone the original preprocessed tensor and enable gradients
                gradcam_input = input_tensor.clone().detach().to(app_state.device).requires_grad_(True)
                
                # Generate specific disease visualization array
                heatmap_img = explainer.generate_heatmap(
                    input_tensor=gradcam_input,
                    class_idx=top_class_idx,
                    original_image=np.array(image) # Convert PIL Image to numpy array for Grad-CAM overlay
                )
                
                heatmap_b64 = heatmap_to_base64(heatmap_img)
        except Exception as e:
            logger.error(f"Grad-CAM generation failed: {e}", exc_info=True)

        # Step 7.1: Reverse Image Similarity Search
        similar_cases = []
        try:
            model = app_state.pytorch_models.get("densenet121")
            if model:
                from app.pipeline.similarity import get_similarity_engine
                sim_engine = get_similarity_engine(model, app_state.device)
                similar_cases = sim_engine.find_similar(input_tensor, top_k=5)
        except Exception as e:
            logger.warning(f"Similarity search failed: {e}")

        # Step 8: Risk score
        risk_assessment = app_state.risk_engine.compute_risk(
            probabilities=probabilities,
            uncertainty=uncertainty_data,
        )

        # Compile patient details
        patient_details = None
        if patient_name or patient_age or patient_gender or patient_phone or patient_address or symptoms or smoking_history:
            patient_details = {
                "name": patient_name,
                "age": patient_age,
                "gender": patient_gender,
                "phone": patient_phone,
                "address": patient_address,
                "symptoms": symptoms,
                "smoking_history": smoking_history
            }

        # Generate report
        report = generate_report(
            probabilities=probabilities,
            risk_assessment=risk_assessment,
            uncertainty=uncertainty_data,
            calibrated=calibrated,
            patient_details=patient_details,
        )

        # Store report here first so background task can access it
        app_state.reports[report.report_id] = report
        from app.utils.storage import save_report
        save_report(report)

        ai_second_opinion = "Analyzing in background..."
        report.ai_summary = "AI Summary is generating in the background. Please check the AI Summary tab shortly."
        report.ai_patient_summary = "Patient Summary is generating in the background."
        
        # Step 10 & 11: Generate AI Summaries and Second Opinions in the BACKGROUND
        def _bg_generate(report_id: str, p_summary: str, p_opinion: str, sys_op: str):
            try:
                import threading
                
                # Doing this sequentially in a bg thread to avoid blasting Ollama with concurrent requests 
                # resolving the massive slow down when invoking two 7B models at the exact moment.
                
                # 1. Clinical Summary
                try:
                    logger.info("Generating Clinical Summary via Meditron...")
                    ai_summary = generate_clinical_summary(p_summary)
                    if report_id in app_state.reports:
                        app_state.reports[report_id].ai_summary = ai_summary
                except Exception as e:
                    logger.error(f"Clinical summary generation failed: {e}")
                    if report_id in app_state.reports:
                        app_state.reports[report_id].ai_summary = "Clinical summary failed."

                # 2. Patient Summary
                try:
                    logger.info("Generating Patient Summary via Meditron...")
                    ai_patient_summary = generate_patient_summary(p_summary)
                    if report_id in app_state.reports:
                        app_state.reports[report_id].ai_patient_summary = ai_patient_summary
                except Exception as e:
                    logger.error(f"Patient summary generation failed: {e}")
                    if report_id in app_state.reports:
                        app_state.reports[report_id].ai_patient_summary = "Patient summary failed."

                # 3. Second Opinion
                try:
                    logger.info("Generating Second Opinion via Meditron...")
                    ai_second_opinion = generate_ai_response_sync(p_opinion, sys_op, "meditron:7b", 2)
                    if report_id in app_state.reports:
                        app_state.reports[report_id].ai_second_opinion = ai_second_opinion
                except Exception as e:
                    logger.error(f"Second opinion generation failed: {e}")
                    app_state.reports[report_id].ai_second_opinion = "Second opinion synthesis failed."
                
                from app.utils.storage import save_report
                if report_id in app_state.reports:
                    save_report(app_state.reports[report_id])

            except Exception as e:
                logger.error(f"Background LLM summary failed: {e}")
                if report_id in app_state.reports:
                    app_state.reports[report_id].ai_summary = "AI Summary unavailable."
                    app_state.reports[report_id].ai_patient_summary = "Patient Summary unavailable."
                    app_state.reports[report_id].ai_second_opinion = "Second opinion synthesis failed."

        prompt_summary = f"Patient Name: {patient_name or 'Unknown'}, Age: {patient_age or 'Unknown'}.\n"
        if symptoms:
            prompt_summary += f"Symptoms: {symptoms}.\n"
        if smoking_history:
            prompt_summary += f"Smoking History: {smoking_history}.\n"
        prompt_summary += f"Disease Probabilities: {', '.join([f'{d}: {float(probabilities[i]):.1%}' for i, d in enumerate(DISEASE_LABELS) if float(probabilities[i]) > 0.05])}\n"
        prompt_summary += f"Risk Level: {risk_assessment.get('risk_level')}, Score: {risk_assessment.get('risk_score')}\n"
        
        sim_cases_text = ", ".join([f"{c['diagnosis']} (sim: {c['similarity']:.2f})" for c in similar_cases])
        prompt_opinion = f"Neural Network Predictions:\n{prompt_summary}\n"
        prompt_opinion += f"Most Visually Similar Historical Cases from NIH Dataset:\n{sim_cases_text}\n"
        prompt_opinion += f"Model Uncertainty: {uncertainty_data.get('overall_uncertainty', 'unknown')} variance.\n\n"
        prompt_opinion += "Based on this data, act as a senior medical reviewing radiologist. Provide a 2-paragraph comparative second opinion. Discuss whether the visual similarities in historical dataset cases support or contradict the neural network's top predictions. Note any discrepancies and suggest focus areas for the attending physician."
        
        system_op = "You are Wavelength's Senior AI Radiologist providing a highly clinical and analytical comparative second opinion."
        
        background_tasks.add_task(
            _bg_generate, 
            report.report_id, 
            prompt_summary, 
            prompt_opinion, 
            system_op
        )

        # Bind rich multimedia payload to report 
        report.ai_second_opinion = ai_second_opinion
        report.similar_cases = similar_cases
        report.images = {
            "original": original_base64,
            "segmentation_overlay": segmentation_overlay_b64,
            "heatmap": heatmap_b64,
        }

        elapsed = time.time() - start_time

        return JSONResponse({
            "success": True,
            "inference_time_ms": round(elapsed * 1000, 1),
            "report_id": report.report_id,
            "disease_probabilities": {
                label: round(float(probabilities[i]), 4)
                for i, label in enumerate(DISEASE_LABELS)
            },
            "differential_diagnoses": report.differential_diagnoses,
            "justifications": report.justifications,
            "risk_assessment": risk_assessment,
            "uncertainty": uncertainty_data,
            "calibrated": calibrated,
            "similar_cases": similar_cases,
            "ai_summary": report.ai_summary,
            "ai_second_opinion": ai_second_opinion,
            "images": {
                "original": original_base64,
                "segmentation_overlay": segmentation_overlay_b64,
                "heatmap": heatmap_b64,
            },
            "report": report.to_dict(),
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/batch-predict")
async def batch_predict(files: List[UploadFile] = File(...)):
    """
    Analyze multiple chest X-ray images.

    Processes each image through the full pipeline and returns
    aggregated results.
    """
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 images per batch")

    results = []
    for i, file in enumerate(files):
        try:
            # Read file
            image_bytes = await file.read()
            is_valid, error_msg = validate_image(image_bytes)

            if not is_valid:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": error_msg,
                })
                continue

            image = load_image(image_bytes)
            input_tensor = preprocess_for_inference(image)

            if app_state.onnx_runner:
                input_np = input_tensor.numpy()
                predictions = app_state.onnx_runner.predict_ensemble(input_np)

                if app_state.ensemble:
                    probabilities = app_state.ensemble.combine(predictions)
                else:
                    probabilities = np.mean(list(predictions.values()), axis=0)
            else:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": "Models not loaded",
                })
                continue

            risk = app_state.risk_engine.compute_risk(probabilities)

            results.append({
                "filename": file.filename,
                "success": True,
                "disease_probabilities": {
                    label: round(float(probabilities[j]), 4)
                    for j, label in enumerate(DISEASE_LABELS)
                },
                "risk_assessment": risk,
            })

        except Exception as e:
            logger.error(f"Batch item {i} failed: {e}")
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e),
            })

    return JSONResponse({
        "success": True,
        "total": len(files),
        "processed": sum(1 for r in results if r.get("success")),
        "results": results,
    })
