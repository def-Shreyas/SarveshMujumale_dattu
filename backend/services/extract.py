import fitz  # PyMuPDF

def extract_pdf_text(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF using PyMuPDF
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text