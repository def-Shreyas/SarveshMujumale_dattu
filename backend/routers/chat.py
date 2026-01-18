import time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from services.chat_engine import build_chat_response
from fastapi.concurrency import run_in_threadpool

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None

@router.post("/chat")
async def chat_endpoint(data: ChatRequest):
    result = await run_in_threadpool(
        build_chat_response,
        data.message
    )

    return {
        "answer": result["answer"],
        "laws": result.get("laws", []),
        "screenshots": result.get("screenshots", [])
    }

    # except Exception as e:
    #     return {
    #         "answer": "An internal error occurred while processing the request.",
    #         "laws": [],
    #         "screenshots": [],
    #         "error": str(e)
    #     }