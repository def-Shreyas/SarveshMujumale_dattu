"""
FastAPI dependencies for authentication
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from auth.auth_utils import decode_access_token
from auth.database import get_database
from bson import ObjectId
from datetime import datetime, time

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.get("is_active", False) or user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended"
        )
    
    # Convert ObjectId to string
    user["id"] = str(user["_id"])
    return user


async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Get current active user"""
    return current_user


async def get_current_admin_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Get current admin user"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user


async def track_api_usage(
    user_id: str,
    endpoint: str,
    method: str,
    status_code: int,
    response_time: float,
    file_size: Optional[int] = None,
    error_message: Optional[str] = None
):
    """Track API usage for analytics"""
    db = get_database()
    
    # Record API call
    api_call = {
        "user_id": user_id,
        "endpoint": endpoint,
        "method": method,
        "status_code": status_code,
        "response_time": response_time,
        "file_size": file_size or 0,
        "timestamp": datetime.utcnow(),
        "error_message": error_message,
        "success": status_code < 400
    }
    
    await db.api_calls.insert_one(api_call)
    
    # Update daily usage stats
    # Convert date to datetime for MongoDB compatibility (BSON doesn't support date objects)
    today_date = datetime.utcnow().date()
    today = datetime.combine(today_date, time.min)
    
    # Check if document exists to avoid MongoDB conflict
    # MongoDB doesn't allow setting a field and incrementing nested fields in the same operation
    existing_doc = await db.usage_stats.find_one({"user_id": user_id, "date": today})
    
    if not existing_doc:
        # For new documents, initialize endpoints_used first
        # Handle race condition: if two requests try to insert simultaneously
        try:
            await db.usage_stats.insert_one({
                "user_id": user_id,
                "date": today,
                "api_calls": 0,
                "total_processing_time": 0,
                "successful_calls": 0,
                "failed_calls": 0,
                "endpoints_used": {},
                "file_sizes": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
        except Exception:
            # Document was created by another request, continue with update
            pass
    
    # Now update with increment operations (endpoints_used already exists)
    update_data = {
        "$inc": {
            "api_calls": 1,
            "total_processing_time": response_time,
            "successful_calls": 1 if status_code < 400 else 0,
            "failed_calls": 1 if status_code >= 400 else 0,
            f"endpoints_used.{endpoint}": 1
        },
        "$push": {"file_sizes": file_size or 0},
        "$set": {
            "updated_at": datetime.utcnow()
        }
    }
    
    await db.usage_stats.update_one(
        {"user_id": user_id, "date": today},
        update_data
    )
    
    # Increment user's API calls used
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"api_calls_used": 1}, "$set": {"last_activity": datetime.utcnow()}}
    )

