from fpdf import FPDF
import uuid
import os

# Safe Windows-compatible report folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  
REPORT_DIR = os.path.join(BASE_DIR, "..", "dattu_reports")  
REPORT_DIR = os.path.abspath(REPORT_DIR)

def generate_report(title, content):

    # Create folder safely
    os.makedirs(REPORT_DIR, exist_ok=True)

    file_id = str(uuid.uuid4()) + ".pdf"
    file_path = os.path.join(REPORT_DIR, file_id)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    pdf.cell(0, 10, txt=title, ln=True)
    pdf.multi_cell(0, 8, txt=content)

    pdf.output(file_path)

    # Return relative path for frontend
    return f"dattu_reports/{file_id}"
