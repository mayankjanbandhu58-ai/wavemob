"""
Report Routes

GET /report/{id} — Retrieve a generated report
GET /report/{id}/pdf — Download PDF version
GET /reports — Retrieve all generated reports
"""

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, Response

from app.state import app_state
from app.pipeline.report_generator import generate_pdf_report

logger = logging.getLogger("wavelength.routes.report")

router = APIRouter()


@router.get("/report/{report_id}")
async def get_report(report_id: str):
    """
    Retrieve a previously generated report.

    Args:
        report_id: Report identifier (e.g., "A1B2C3D4")

    Returns:
        Full report JSON
    """
    report = app_state.reports.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    return JSONResponse(report.to_dict())


@router.get("/reports")
async def get_all_reports():
    """
    Retrieve all generated reports.

    Returns:
        List of report JSON objects.
    """
    reports_list = [report.to_dict() for report in app_state.reports.values()]
    return JSONResponse({"reports": reports_list})


@router.get("/report/{report_id}/pdf")
async def download_report_pdf(report_id: str):
    """
    Download PDF version of a report.

    Args:
        report_id: Report identifier

    Returns:
        PDF file download
    """
    report = app_state.reports.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    try:
        pdf_bytes = bytes(generate_pdf_report(report))

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=wavelength_report_{report_id}.pdf",
            },
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="PDF generation failed")
@router.put("/report/{report_id}/verify")
async def verify_report(report_id: str, payload: dict):
    """
    Verify or Reject an AI Report (Human-In-The-Loop)

    Args:
        report_id: Report identifier
        payload: { "status": "approved" | "overridden", "notes": str }

    Returns:
        Updated report status dict
    """
    report = app_state.reports.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    status = payload.get("status")
    notes = payload.get("notes", "")

    if status not in ["approved", "overridden"]:
        raise HTTPException(status_code=400, detail="Invalid verification status")

    report.verification_status = status
    report.reviewer_notes = notes

    from app.utils.storage import save_report
    save_report(report)

    logger.info(f"Report {report_id} verified by clinician: {status}")
    return {"message": "Verification saved", "status": status, "notes": notes}

@router.put("/report/{report_id}/correction")
async def correct_report(report_id: str, payload: dict):
    """
    Submit a radiologist correction for a report (Active Learning).
    
    Args:
        report_id: Report identifier
        payload: { "corrected_disease": str, "notes": str, "radiologist_id": str }
    """
    report = app_state.reports.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    corrected_disease = payload.get("corrected_disease")
    notes = payload.get("notes", "")
    radiologist_id = payload.get("radiologist_id", "Unknown")

    if not corrected_disease:
        raise HTTPException(status_code=400, detail="Missing corrected_disease")

    # Update report state
    report.reviewer_notes = f"CORRECTION ({radiologist_id}): {corrected_disease}. {notes}"
    report.verification_status = "overridden"

    from app.utils.storage import save_report
    save_report(report)

    # Log for training queue (Active Learning)
    from app.config import DATA_DIR
    import json
    from datetime import datetime
    correction_file = DATA_DIR / "corrections.json"
    
    correction_data = {
        "report_id": report_id,
        "corrected_disease": corrected_disease,
        "notes": notes,
        "radiologist_id": radiologist_id,
        "timestamp": datetime.now().isoformat()
    }
    
    try:
        corrections = []
        if correction_file.exists():
            with open(correction_file, "r") as f:
                corrections = json.load(f)
        corrections.append(correction_data)
        with open(correction_file, "w") as f:
            json.dump(corrections, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save correction to JSON: {e}")

    logger.info(f"Report {report_id} corrected by {radiologist_id}: {corrected_disease}")
    return {"message": "Correction saved to training queue", "status": "overridden"}
