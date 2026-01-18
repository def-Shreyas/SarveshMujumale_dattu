from fastapi import APIRouter, UploadFile, File
from phi.model.openai import OpenAIChat
from phi.agent import Agent
from dotenv import load_dotenv
from services.extract import extract_pdf_text
import os

router = APIRouter()
load_dotenv()
OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")
client = Agent(
    model=OpenAIChat(
        model="gpt-4.1-mini",
        api_key=OPENAI_API_KEY,
    )
    ),

@router.post("/analyze-pdf")
async def analyze_pdf(file: UploadFile = File(...)):
    """
    1. Extract PDF text
    2. Identify the incident type
    3. Get 3 real similar global cases
    4. Return structured response
    """

    # Step 1 — Read PDF
    pdf_bytes = await file.read()

    # Step 2 — Extract text using service function
    extracted_text = extract_pdf_text(pdf_bytes)

    # Step 3 — Identify the incident type
    incident_prompt = f"""
    Read this safety incident document:

    {extracted_text}

    Identify the MAIN INCIDENT TYPE in 3–6 words.
    Only output the incident type. No extra text.
    """

    incident_type = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": incident_prompt}]
    ).choices[0].message["content"]

    # Step 4 — Get similar global incidents
    similar_prompt = f"""
    Give me 3 REAL global incident cases similar to:
    "{incident_type}"

    Each case must include:
    - Title
    - Country
    - Year
    - 3–5 line summary
    - What went wrong

    Format as clean JSON list.
    """

    similar_cases = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": similar_prompt}]
    ).choices[0].message["content"]

    return {
        "incident_type": incident_type.strip(),
        "similar_cases": similar_cases
    }