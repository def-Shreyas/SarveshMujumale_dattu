from datetime import datetime, timedelta
from typing import Dict, Any


def is_subscription_expired(user: Dict[str, Any]) -> bool:
    """
    Returns True if subscription has ended (ignores grace period)
    """
    end_date = user.get("subscription_end_date")

    if not end_date:
        return False

    # Mongo might store as string in some cases
    if isinstance(end_date, str):
        end_date = datetime.fromisoformat(end_date.replace("Z", ""))

    return datetime.utcnow() > end_date


def is_in_grace_period(user: Dict[str, Any]) -> bool:
    """
    Returns True if user is within grace period after expiry
    """
    end_date = user.get("subscription_end_date")

    if not end_date:
        return False

    if isinstance(end_date, str):
        end_date = datetime.fromisoformat(end_date.replace("Z", ""))

    grace_days = user.get("grace_period_days", 7)
    grace_end = end_date + timedelta(days=grace_days)

    now = datetime.utcnow()
    return end_date < now <= grace_end
