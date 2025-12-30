# services/safety_intelligence/router.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from auth.dependencies import get_current_active_user, track_api_usage
from .engine import run_safety_intelligence
from .schemas import SafetyQueryRequest, SafetyQueryResponse, SafetyPDFRequest
from .permissions import can_query_safety_ai, can_generate_pdf
from .case_repository import search_cases
from .pdf_generator import generate_case_study_pdf
import time, uuid
from .pdf_generator import generate_case_study_pdf

import tempfile
import os

router = APIRouter(prefix="/safety", tags=["Safety Intelligence"])

@router.post("/query", response_model=SafetyQueryResponse)
async def ask_safety_ai(
    payload: SafetyQueryRequest,
    current_user: dict = Depends(get_current_active_user)
):
    if not can_query_safety_ai(current_user):
        raise HTTPException(status_code=403, detail="Upgrade subscription to use Safety AI")

    start = time.time()
    cases = search_cases(payload.query)

    await track_api_usage(
        user_id=str(current_user["_id"]),
        endpoint="/safety/query",
        method="POST",
        status_code=200,
        response_time=time.time() - start,
        deduct_api_call=True
    )

    return {
        "query": payload.query,
        "total_cases": len(cases),
        "cases": cases
    }
    
@router.post("/pdf")
async def generate_safety_pdf(
    payload: SafetyPDFRequest,
    current_user: dict = Depends(get_current_active_user)
):
    if not can_generate_pdf(current_user):
        raise HTTPException(
            status_code=403,
            detail="PDF generation is available only for Premium and Enterprise plans"
        )

    start_time = time.time()

    # Run safety intelligence engine
    cases = run_safety_intelligence(payload.query)

    if not cases:
        raise HTTPException(status_code=404, detail="No relevant incidents found")

    # Create temp PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        pdf_path = tmp.name

    generate_case_study_pdf(
        cases=cases,
        output_path=pdf_path,
        query=payload.query
    )

    # Track usage (counts as API call)
    await track_api_usage(
        user_id=str(current_user["_id"]),
        endpoint="/safety/pdf",
        method="POST",
        status_code=200,
        response_time=time.time() - start_time,
        deduct_api_call=True
    )

    return FileResponse(
        path=pdf_path,
        filename="DATTU_Safety_Case_Studies.pdf",
        media_type="application/pdf"
    )