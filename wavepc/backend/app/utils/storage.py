import json
import logging
from pathlib import Path
from app.config import DATA_DIR
from app.state import app_state
from app.pipeline.report_generator import ClinicalReport

logger = logging.getLogger("wavelength.utils.storage")

REPORTS_DIR = DATA_DIR / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

def save_report(report: ClinicalReport):
    """Saves a report object to disk as JSON."""
    try:
        file_path = REPORTS_DIR / f"{report.report_id}.json"
        with open(file_path, "w") as f:
            json.dump(report.to_dict(), f, indent=2)
        logger.info(f"Report {report.report_id} saved to disk.")
    except Exception as e:
        logger.error(f"Failed to save report {report.report_id} to disk: {e}")

def load_all_reports():
    """Loads all report JSONs from disk into app_state.reports."""
    try:
        report_files = list(REPORTS_DIR.glob("*.json"))
        loaded_count = 0
        for file_path in report_files:
            try:
                with open(file_path, "r") as f:
                    data = json.load(f)
                    
                # Reconstruct ClinicalReport object
                report = ClinicalReport(
                    report_id=data["report_id"],
                    timestamp=data["timestamp"],
                    disease_probabilities=data["disease_probabilities"],
                    risk_assessment=data["risk_assessment"],
                    uncertainty=data["uncertainty"],
                    calibrated=data.get("calibrated", True),
                    model_version=data.get("model_version", "1.0.0"),
                    patient_details=data.get("patient_details")
                )
                report.differential_diagnoses = data.get("differential_diagnoses", [])
                report.justifications = data.get("justifications", {})
                report.ai_summary = data.get("ai_summary", "")
                report.ai_patient_summary = data.get("ai_patient_summary", "")
                report.ai_second_opinion = data.get("ai_second_opinion", "")
                report.similar_cases = data.get("similar_cases", [])
                report.images = data.get("images", {})
                report.verification_status = data.get("verification_status", "pending_review")
                report.reviewer_notes = data.get("reviewer_notes", "")
                
                app_state.reports[report.report_id] = report
                loaded_count += 1
            except Exception as e:
                logger.error(f"Failed to load report from {file_path}: {e}")
        
        logger.info(f"Loaded {loaded_count} reports from disk into memory.")
    except Exception as e:
        logger.error(f"Failed to scan reports directory: {e}")
