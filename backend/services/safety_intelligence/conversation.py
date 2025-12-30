# services/safety_intelligence/conversation.py

GREETINGS = {"hi", "hello", "hey", "good morning", "good evening"}

def is_greeting(text: str) -> bool:
    return text in GREETINGS

def is_small_talk(text: str) -> bool:
    return any(k in text for k in ["how are you", "thank", "who are you"])

def handle_small_talk(text: str) -> str:
    if "thank" in text:
        return "You’re welcome 🙂 Always here to help."
    if "who are you" in text:
        return (
            "I’m DATTU — your AI assistant for safety intelligence, "
            "incident analysis, and compliance support."
        )
    return "Hello 👋 How can I help you today?"
