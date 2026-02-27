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
