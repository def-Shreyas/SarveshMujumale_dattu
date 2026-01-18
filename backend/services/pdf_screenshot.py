import fitz
import os

SCREENSHOT_DIR = "screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def generate_pdf_screenshot(pdf_name, page_number):
    pdf_path = f"laws/{pdf_name}"

    doc = fitz.open(pdf_path)
    page = doc.load_page(page_number - 1)

    pix = page.get_pixmap(dpi=200)

    filename = f"{pdf_name.replace('.pdf','')}_p{page_number}.png"
    output_path = os.path.join(SCREENSHOT_DIR, filename)

    pix.save(output_path)

    return f"/screenshots/{filename}"