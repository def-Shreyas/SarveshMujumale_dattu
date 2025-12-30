# services/safety_intelligence/permissions.py

def can_query_safety_ai(user: dict) -> bool:
    return (
        user["status"] == "active"
        and user["subscription_tier"] in ["basic", "premium", "enterprise"]
    )

def can_generate_pdf(user: dict) -> bool:
    return user["subscription_tier"] in ["premium", "enterprise"]