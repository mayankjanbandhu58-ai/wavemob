import base64
import io
import datetime
from pathlib import Path
from fpdf import FPDF
from app.config import PROJECT_ROOT

# Optional: if you have a logo, you can set its path here
LOGO_PATH = PROJECT_ROOT / "frontend" / "public" / "logo.png"

class ReportPDF(FPDF):
    def header(self):
        # Logo (if exists)
        if LOGO_PATH.exists():
            self.image(str(LOGO_PATH), 10, 8, 33)
        
        # Arial bold 15
        self.set_font('helvetica', 'B', 20)
        # Move to the right
        self.cell(80)
        # Title
        self.set_text_color(33, 37, 41)
        self.cell(30, 10, 'Wavelength AI Clinical Report', 0, 0, 'C')
        # Line break
        self.ln(20)
        
        # Draw a line
        self.set_draw_color(200, 200, 200)
        self.line(10, 30, 200, 30)
        self.ln(5)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        # Arial italic 8
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        # Page number
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}} | Generated uniquely by Wavelength AI', 0, 0, 'C')

def generate_patient_report_pdf(payload: dict) -> bytes:
    """
    Generate a high-fidelity PDF report from a JSON payload.
    Payload expected structure:
    {
        "patientName": "John Doe",
        "patientId": "12345",
        "date": "2026-02-26",
        "findings": "...",
        "aiConfidence": 92.5,
        "base64Images": ["data:image/jpeg;base64,..."] # optional list of charts/heatmaps
    }
    """
    pdf = ReportPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # ─── Patient Demographics ───
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(0, 102, 204) # A nice premium blue
    pdf.cell(0, 10, 'Patient Information', ln=True)
    
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(50, 50, 50)
    
    patient_name = payload.get("patientName", "Unknown")
    patient_id = payload.get("patientId", "N/A")
    report_date = payload.get("date", datetime.datetime.now().strftime("%Y-%m-%d %H:%M"))
    
    pdf.cell(50, 8, f"Name: {patient_name}", ln=False)
    pdf.cell(50, 8, f"Patient ID: {patient_id}", ln=False)
    pdf.cell(50, 8, f"Date: {report_date}", ln=True)
    pdf.ln(5)
    
    # ─── AI Confidence Score ───
    confidence = payload.get("aiConfidence")
    if confidence is not None:
        pdf.set_font('helvetica', 'B', 14)
        pdf.set_text_color(0, 102, 204)
        pdf.cell(0, 10, 'AI Analysis Metrics', ln=True)
        
        pdf.set_font('helvetica', '', 12)
        # Color based on confidence (Green if high, Yellow if med, Red if low)
        if confidence >= 90:
            pdf.set_text_color(0, 153, 0)
        elif confidence >= 70:
            pdf.set_text_color(204, 153, 0)
        else:
            pdf.set_text_color(204, 0, 0)
            
        pdf.cell(0, 8, f"Overall Diagnostic Confidence: {confidence}%", ln=True)
        pdf.set_text_color(50, 50, 50) # reset
        pdf.ln(5)
        
    # ─── Clinical Findings ───
    findings = payload.get("findings", "No findings provided.")
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(0, 102, 204)
    pdf.cell(0, 10, 'Detailed AI Findings & Report', ln=True)
    
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(30, 30, 30)
    # Multi_cell allows text wrapping
    pdf.multi_cell(0, 8, findings)
    pdf.ln(10)
    
    # ─── Images / Charts (Grad-CAM, etc.) ───
    base64_images = payload.get("base64Images", [])
    if base64_images:
        pdf.add_page() # Put images on a new page for clean layout
        pdf.set_font('helvetica', 'B', 14)
        pdf.set_text_color(0, 102, 204)
        pdf.cell(0, 10, 'Imaging & Radiomics Analysis', ln=True)
        pdf.ln(5)
        
        for idx, b64_str in enumerate(base64_images):
            try:
                # Remove data:image/jpeg;base64, prefix if present
                if ',' in b64_str:
                    b64_str = b64_str.split(',')[1]
                
                img_data = base64.b64decode(b64_str)
                
                # FPDF needs a file-like object or a concrete file. We can write to a temporary file
                # or use io.BytesIO, but fpdf2 supports image from BytesIO better depending on version.
                # Let's save to a temp file and load to be safe natively across fpdf versions.
                import tempfile
                import os
                
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
                    temp_file.write(img_data)
                    temp_filename = temp_file.name
                    
                # Calculate positioning (2 images per row roughly)
                pdf.image(temp_filename, x=15, w=150)
                pdf.ln(5)
                
                # Clean up
                os.remove(temp_filename)
            except Exception as e:
                pdf.set_font('helvetica', 'I', 10)
                pdf.set_text_color(200, 0, 0)
                pdf.cell(0, 8, f"Failed to load image attachment {idx + 1}", ln=True)
                print(f"PDF Image load error: {e}")
                
    # Return as bytes
    # output(dest='S') may return a string or a bytearray depending on fpdf2 version
    pdf_output = pdf.output(dest='S')
    if isinstance(pdf_output, str):
        return pdf_output.encode('latin-1')
    return bytes(pdf_output)

