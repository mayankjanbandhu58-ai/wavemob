import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
from app.config import DATA_DIR

from app.utils.pdf_generator import generate_patient_report_pdf

logger = logging.getLogger(__name__)

router = APIRouter()

class ExportRequest(BaseModel):
    patientName: str
    patientId: str
    date: Optional[str] = None
    findings: str
    aiConfidence: Optional[float] = None
    base64Images: Optional[List[str]] = None

@router.post("/pdf")
async def export_pdf(payload: ExportRequest):
    """
    Generates a high-fidelity PDF from the provided clinical data payload.
    Returns the PDF file payload directly as binary.
    """
    logger.info(f"Generating PDF for patient {payload.patientId}")
    try:
        # Convert pydantic model to dict
        pdf_bytes = generate_patient_report_pdf(payload.model_dump())
        
        # Return as a downloadable PDF file
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Wavelength_Report_{payload.patientId}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
