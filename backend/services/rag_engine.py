import os
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import chromadb
import uuid
import re

# -------------------- Chroma Client --------------------
chroma_client = chromadb.PersistentClient(path="chroma_db")

laws_collection = chroma_client.get_or_create_collection(
    name="laws_master",
    metadata={"hnsw:space": "cosine"}
)

# -------------------- OCR / TEXT --------------------
def extract_text_from_page(page):
    text = page.get_text("text")
    if text and len(text.strip()) > 20:
        return text

    pix = page.get_pixmap(dpi=200)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    return pytesseract.image_to_string(img)

# -------------------- SMART CHUNKING --------------------
def smart_chunk(text, max_chars=500):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""

    for s in sentences:
        if len(current) + len(s) < max_chars:
            current += " " + s
        else:
            chunks.append(current.strip())
            current = s

    if current.strip():
        chunks.append(current.strip())

    return chunks

# -------------------- INGESTION --------------------
def load_law_pdfs():
    laws_path = "laws"

    if not os.path.exists(laws_path):
        print("❌ Folder 'laws' does not exist.")
        return

    print("\n🚀 Starting Law PDF Ingestion\n")

    for file in os.listdir(laws_path):
        if not file.lower().endswith(".pdf"):
            continue

        pdf_path = os.path.join(laws_path, file)
        print(f"📄 Processing: {file}")

        doc = fitz.open(pdf_path)

        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            text = extract_text_from_page(page)

            if not text.strip():
                continue

            chunks = smart_chunk(text)

            for chunk in chunks:
                # 🎯 VERY IMPORTANT FILTER
                if not any(k in chunk.lower() for k in [
                    "helmet", "ppe", "protective", "head",
                    "safety", "hard hat", "injury", "danger"
                ]):
                    continue

                laws_collection.add(
                    ids=[str(uuid.uuid4())],
                    documents=[chunk],
                    metadatas=[{
                        "pdf_name": file,
                        "page_number": page_num + 1
                    }]
                )

    print("\n✅ Law PDFs successfully indexed into ChromaDB!\n")

# -------------------- RUN --------------------
if __name__ == "__main__":
    load_law_pdfs()
