"""
Rate limiting utilities
"""
from datetime import datetime, timedelta, time
from typing import Optional
from auth.database import get_database
from auth.auth_utils import get_subscription_limits
from bson import ObjectId
from fastapi import HTTPException, status


async def check_rate_limit(user: dict) -> dict:
    """Check if user has exceeded rate limits"""
    db = get_database()
    user_id = str(user["_id"])
    subscription_tier = user.get("subscription_tier", "free")
    limits = get_subscription_limits(subscription_tier)
    
    # Get user's current usage
    # Convert date to datetime for MongoDB compatibility (BSON doesn't support date objects)
    today_date = datetime.utcnow().date()
    today = datetime.combine(today_date, time.min)
    start_of_month_date = datetime.utcnow().replace(day=1).date()
    start_of_month = datetime.combine(start_of_month_date, time.min)
    
    # Get daily usage
    daily_stats = await db.usage_stats.find_one(
        {"user_id": user_id, "date": today}
    )
    daily_used = daily_stats.get("api_calls", 0) if daily_stats else 0
    
    # Get monthly usage
    monthly_stats = await db.usage_stats.aggregate([
        {
            "$match": {
                "user_id": user_id,
                "date": {"$gte": start_of_month}
            }
        },
        {
            "$group": {
                "_id": None,
                "total_calls": {"$sum": "$api_calls"}
            }
        }
    ]).to_list(length=1)
    
    monthly_used = monthly_stats[0]["total_calls"] if monthly_stats else 0
    
    # Check limits
    api_calls_limit = user.get("api_calls_limit", -1)
    api_calls_used = user.get("api_calls_used", 0)
    
    # Check monthly limit (if not unlimited)
    if api_calls_limit != -1 and api_calls_used >= api_calls_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "message": "Monthly API limit exceeded",
                "limit": api_calls_limit,
                "used": api_calls_used
            }
        )
    
    # Check daily limit (if not unlimited)
    daily_limit = limits["daily_limit"]
    if daily_limit != -1 and daily_used >= daily_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "message": "Daily API limit exceeded",
                "limit": daily_limit,
                "used": daily_used
            }
        )
    
    return {
        "api_calls_limit": api_calls_limit,
        "api_calls_used": api_calls_used,
        "api_calls_remaining": api_calls_limit - api_calls_used if api_calls_limit != -1 else -1,
        "daily_limit": daily_limit,
        "daily_used": daily_used,
        "daily_remaining": daily_limit - daily_used if daily_limit != -1 else -1,
        "monthly_limit": limits["monthly_limit"],
        "monthly_used": monthly_used,
        "monthly_remaining": limits["monthly_limit"] - monthly_used if limits["monthly_limit"] != -1 else -1,
        "subscription_tier": subscription_tier
    }


async def check_file_size_limit(user: dict, file_size: int):
    """Check if file size exceeds user's limit"""
    subscription_tier = user.get("subscription_tier", "free")
    limits = get_subscription_limits(subscription_tier)
    file_size_limit = limits["file_size_limit"]
    
    if file_size > file_size_limit:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "error": "File too large",
                "message": f"File size exceeds {file_size_limit / (1024 * 1024):.0f}MB limit",
                "max_size": file_size_limit,
                "received_size": file_size
            }
        )



