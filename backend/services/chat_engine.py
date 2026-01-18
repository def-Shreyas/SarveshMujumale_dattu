from services.rag_search import search_laws
from services.pdf_highlighter import highlight_text_in_pdf
from services.ai_fallback import ask_ai

def build_chat_response(user_query: str):
    query_lower = user_query.lower()

    if any(k in query_lower for k in ["worker", "employee", "operator"]):
        tone = "Explain simply, like speaking to a factory worker."
    elif any(k in query_lower for k in ["company", "factory", "management", "employer"]):
        tone = "Explain formally, like advising factory management."
    else:
        tone = "Explain clearly and professionally."


    law_hits = search_laws(user_query, top_k=3)

    laws_payload = []
    screenshots = []

    for law in law_hits:
        image_url = highlight_text_in_pdf(
            law["pdf_name"],
            law["page_number"],
            law["text"]
        )

        laws_payload.append({
            "law_name": law["pdf_name"].replace("_", " ").replace(".pdf", ""),
            "pdf_name": law["pdf_name"],
            "page_number": law["page_number"],
            "excerpt": law["text"][:400],
            "confidence": f'{law["confidence"]}%'
        })


        if image_url:
            screenshots.append({
                "pdf_name": law["pdf_name"],
                "page_number": law["page_number"],
                "image_url": image_url
            })

    # Explanation logic
    if law_hits:
        context = "\n".join([l["text"] for l in law_hits])

        answer = ask_ai([
            {
                "role": "system",
                "content": f"You are DATTU AI. {tone} Use legal backing."
            },
            {
                "role": "user",
                "content": f"Query: {user_query}\n\nApplicable law:\n{context}"
            }
        ])

    else:
        answer = ask_ai([
            {
                "role": "system",
                "content": "You are DATTU AI. Answer safety questions carefully."
            },
            {
                "role": "user",
                "content": user_query
            }
        ])

    return {
        "answer": answer,
        "laws": laws_payload,
        "screenshots": screenshots
    }