"""
FastAPI Main Application

Entry point for the Wavelength backend API.
Handles model loading on startup, CORS, and route mounting.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    API_HOST,
    API_PORT,
    CHECKPOINT_DIR,
    CORS_ORIGINS,
    DISEASE_LABELS,
    ONNX_DIR,
)
from app.utils.logging_config import setup_logging
from app.state import app_state

# Setup logging
logger = setup_logging()





@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Loads models on startup, cleans up on shutdown.
    """
    logger.info("=" * 60)
    logger.info("  Wavelength AI — Starting up")
    logger.info("=" * 60)

    # Try to load ONNX models if available
    onnx_densenet = ONNX_DIR / "densenet121.onnx"
    onnx_efficientnet = ONNX_DIR / "efficientnet_v2_s.onnx"

    if onnx_densenet.exists() and onnx_efficientnet.exists():
        try:
            from app.inference.onnx_runner import ONNXInferenceRunner
            runner = ONNXInferenceRunner(device="cuda")
            runner.load_model("densenet121", onnx_densenet)
            runner.load_model("efficientnet_v2_s", onnx_efficientnet)
            app_state.onnx_runner = runner
            logger.info("ONNX models loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load ONNX models: {e}")

    # ── PyTorch Backend for Explainability (Grad-CAM) ──
    # Always load PyTorch DenseNet121 model to support gradient-based heatmaps
    import torch
    from app.models.densenet import build_densenet121
    from app.models.efficientnet import build_efficientnet_v2_s
    from app.config import NUM_CLASSES, DENSENET_DROPOUT, EFFICIENTNET_DROPOUT

    device = "cuda" if torch.cuda.is_available() else "cpu"
    app_state.device = device
    app_state.pytorch_models = getattr(app_state, "pytorch_models", {})

    model_configs = {
        "densenet121": (build_densenet121, DENSENET_DROPOUT),
        "efficientnet_v2_s": (build_efficientnet_v2_s, EFFICIENTNET_DROPOUT),
    }

    for model_name, (builder, dropout) in model_configs.items():
        ckpt_path = CHECKPOINT_DIR / f"{model_name}_best.pth"
        if ckpt_path.exists():
            try:
                model = builder(num_classes=NUM_CLASSES, dropout=dropout, pretrained=False)
                checkpoint = torch.load(ckpt_path, map_location=device, weights_only=False)
                model.load_state_dict(checkpoint["model_state_dict"])
                model = model.to(device)
                model.eval()
                app_state.pytorch_models[model_name] = model
                logger.info(f"PyTorch explainability model loaded for Grad-CAM: {model_name} on {device}")
            except Exception as e:
                logger.warning(f"Failed to load PyTorch model {model_name}: {e}")

    if not app_state.pytorch_models and not app_state.onnx_runner:
        logger.warning("No models loaded at all. Predictions will fail.")

    # Load ensemble config
    ensemble_path = CHECKPOINT_DIR / "ensemble_config.json"
    if ensemble_path.exists():
        from app.pipeline.ensemble import WeightedEnsemble
        app_state.ensemble = WeightedEnsemble.load(ensemble_path)

    # Load temperature calibration
    calibration_path = CHECKPOINT_DIR / "temperature_scaling.pth"
    if calibration_path.exists():
        import torch
        from app.pipeline.calibration import TemperatureScaler
        from app.config import NUM_CLASSES # Ensure NUM_CLASSES is available

        scaler = TemperatureScaler(num_classes=NUM_CLASSES)
        scaler.load_state_dict(torch.load(calibration_path, map_location=device))
        app_state.calibrator = scaler
        logger.info("Temperature calibrator loaded successfully")

    # Initialize risk engine
    from app.pipeline.risk_engine import RiskEngine
    app_state.risk_engine = RiskEngine()

    # Initialize report storage
    app_state.reports = {}

    logger.info("Wavelength API ready for requests")
    
    loaded_models = []
    if app_state.onnx_runner:
        loaded_models = app_state.onnx_runner.loaded_models
    elif app_state.pytorch_models:
        loaded_models = list(app_state.pytorch_models.keys())
        
    logger.info(f"Models loaded: {', '.join(loaded_models) if loaded_models else 'None'}")
    logger.info("=" * 60)

    yield

    # Shutdown
    logger.info("Wavelength AI shutting down...")
    app_state.onnx_runner = None


# Create FastAPI app
app = FastAPI(
    title="Wavelength AI",
    description="AI-Powered Multi-Disease Chest X-Ray Clinical Decision Support System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
from app.routes.predict import router as predict_router
from app.routes.report import router as report_router
from app.routes.analytics import router as analytics_router

app.include_router(predict_router, prefix="/api", tags=["Prediction"])
app.include_router(report_router, prefix="/api", tags=["Reports"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/")
async def root():
    return {
        "service": "Wavelength AI",
        "version": "1.0.0",
        "status": "operational",
        "models_loaded": app_state.onnx_runner.loaded_models if app_state.onnx_runner else [],
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "gpu_available": True,  # Will be checked at startup
        "models_ready": app_state.onnx_runner is not None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)
