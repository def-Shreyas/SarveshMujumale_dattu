from fastapi import APIRouter
from services.pdf_screenshot import generate_pdf_screenshot

router = APIRouter()

@router.get("/screenshot")
def get_screenshot(pdf: str, page: int):
    url = generate_pdf_screenshot(pdf, page)
    return {"image_url": url}
