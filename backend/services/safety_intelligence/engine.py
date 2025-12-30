# services/safety_intelligence/engine.py

from typing import Dict
from .case_repository import search_cases
from .conversation import (
    is_greeting,
    is_small_talk,
    handle_small_talk,
)
from .llm_clients.router import ask_llm
from .ranking import rank_cases  # optional later


# -----------------------------
# 1. Normalize & enrich query
# -----------------------------
def normalize_query(user_query: str) -> Dict[str, str]:
    """
    Converts raw user query into structured safety intent
    """
    query = user_query.lower().strip()

    intent = {
        "raw": user_query,
        "industry": None,
        "hazard": None,
        "event_type": None
    }

    # Simple industry detection (expand later)
    if any(k in query for k in ["oil", "gas", "refinery", "petrochemical"]):
        intent["industry"] = "Oil & Gas"

    if any(k in query for k in ["construction", "scaffold", "crane"]):
        intent["industry"] = "Construction"

    # Hazard detection
    if any(k in query for k in ["fire", "explosion", "blast"]):
        intent["hazard"] = "Explosion / Fire"

    if any(k in query for k in ["fall", "height", "scaffold"]):
        intent["hazard"] = "Fall from Height"

    if any(k in query for k in ["toxic", "gas leak", "chemical"]):
        intent["hazard"] = "Chemical Exposure"

    # Event type
    if "near miss" in query:
        intent["event_type"] = "Near Miss"
    elif "incident" in query or "accident" in query:
        intent["event_type"] = "Incident"

    return intent


# -----------------------------
# 2. Rank cases by relevance
# -----------------------------
def rank_cases(
    cases: List[Dict],
    intent: Dict[str, str]
) -> List[Dict]:
    """
    Assigns a relevance score to each case
    """
    scored_cases = []

    for case in cases:
        score = 0

        if intent["industry"] and intent["industry"] == case.get("industry"):
            score += 3

        if intent["hazard"] and intent["hazard"].lower() in case.get("summary", "").lower():
            score += 3

        if intent["event_type"] and intent["event_type"].lower() in case.get("summary", "").lower():
            score += 2

        if any(word in case.get("title", "").lower() for word in intent["raw"].lower().split()):
            score += 1

        case["_score"] = score
        scored_cases.append(case)

    # Sort by score (highest first)
    scored_cases.sort(key=lambda x: x["_score"], reverse=True)

    return scored_cases


# -----------------------------
# 3. Core Engine Function
# -----------------------------
def run_safety_engine(query: str, user: dict) -> Dict:
    """
    Master brain for DATTU AI
    """

    text = query.lower().strip()

    # 1️⃣ Greetings / small talk
    if is_greeting(text) or is_small_talk(text):
        reply = handle_small_talk(text)
        return {
            "type": "chat",
            "reply": reply
        }

    # 2️⃣ Safety / incident queries
    cases = search_cases(query)

    if cases:
        ai_summary = ask_llm(
            system_prompt="You are a safety expert. Summarize incidents factually.",
            user_prompt=f"Summarize these incidents:\n{cases}"
        )

        return {
            "type": "safety",
            "summary": ai_summary,
            "cases": cases
        }

    # 3️⃣ Fallback to general AI
    fallback = ask_llm(
        system_prompt="You are DATTU, a helpful AI assistant.",
        user_prompt=query
    )

    return {
        "type": "chat",
        "reply": fallback
    }