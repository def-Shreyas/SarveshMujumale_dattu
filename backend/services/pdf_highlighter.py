import fitz
import os

HIGHLIGHT_DIR = "screenshots"
os.makedirs(HIGHLIGHT_DIR, exist_ok=True)

def highlight_text_in_pdf(pdf_name, page_number, search_text):
    pdf_path = f"laws/{pdf_name}"
    doc = fitz.open(pdf_path)
    page = doc.load_page(page_number - 1)

    # Search occurrences
    text_instances = page.search_for(search_text[:80])

    if not text_instances:
        return None

    for inst in text_instances:
        highlight = page.add_highlight_annot(inst)
        highlight.update()

    pix = page.get_pixmap(dpi=200)
    filename = f"{pdf_name.replace('.pdf','')}_p{page_number}_highlight.png"
    output_path = os.path.join(HIGHLIGHT_DIR, filename)
    pix.save(output_path)

    return f"/screenshots/{filename}"
