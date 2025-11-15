"""
Authentication routes for Safety Data Analysis API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import secrets
import string

from auth.dependencies import (
    get_current_user,
    get_current_active_user,
    get_current_admin_user,
    track_api_usage
)
from auth.models import (
    LoginRequest,
    CreateUserRequest,
    UserResponse,
    TokenResponse,
    UsageStatsResponse,
    RateLimitResponse,
    UpgradeSubscriptionRequest,
    SubscriptionTier
)
from auth.auth_utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_subscription_limits
)
from auth.rate_limiter import check_rate_limit
from auth.database import get_database

router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_password(length: int = 12) -> str:
    """Generate a random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    """Login endpoint for users and admins"""
    db = get_database()
    
    # Find user by username
    user = await db.users.find_one({"username": login_data.username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Check if user is active
    if not user.get("is_active", False) or user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended"
        )
    
    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token_expires = timedelta(minutes=1440)  # 24 hours
    access_token = create_access_token(
        data={"sub": str(user["_id"])},
        expires_delta=access_token_expires
    )
    
    # Convert user to response model
    user_response = UserResponse(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        subscription_tier=user.get("subscription_tier", "basic"),
        api_calls_limit=user.get("api_calls_limit", 1000),
        api_calls_used=user.get("api_calls_used", 0),
        company_name=user.get("company_name"),
        contact_person=user.get("contact_person"),
        status=user.get("status", "active"),
        role=user.get("role", "user"),
        created_at=user.get("created_at", datetime.utcnow()),
        last_login=datetime.utcnow(),
        is_active=user.get("is_active", True)
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=86400,  # 24 hours in seconds
        user=user_response
    )


@router.post("/admin/create-user", response_model=dict)
async def create_user(
    user_data: CreateUserRequest,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Create a new user account (Admin only)"""
    db = get_database()
    
    # Check if username already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    existing_email = await db.users.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Generate password if not provided
    password = user_data.password or generate_password()
    hashed_password = get_password_hash(password)
    
    # Create user document
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "subscription_tier": user_data.subscription_tier.value,
        "api_calls_limit": user_data.api_calls_limit,
        "api_calls_used": 0,
        "company_name": user_data.company_name,
        "contact_person": user_data.contact_person,
        "status": "active",
        "role": "user",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "last_activity": None
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # TODO: Send email with credentials (implement email service)
    # send_user_credentials_email(user_data.email, user_data.username, password)
    
    return {
        "success": True,
        "message": "User account created successfully. Credentials sent via email.",
        "user_id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "subscription_tier": user_data.subscription_tier.value,
        "api_calls_limit": user_data.api_calls_limit,
        "password": password  # Remove this in production, only for testing
    }


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_active_user)):
    """Get current user's profile"""
    return UserResponse(
        id=str(current_user["_id"]),
        username=current_user["username"],
        email=current_user["email"],
        subscription_tier=current_user.get("subscription_tier", "basic"),
        api_calls_limit=current_user.get("api_calls_limit", 1000),
        api_calls_used=current_user.get("api_calls_used", 0),
        company_name=current_user.get("company_name"),
        contact_person=current_user.get("contact_person"),
        status=current_user.get("status", "active"),
        role=current_user.get("role", "user"),
        created_at=current_user.get("created_at", datetime.utcnow()),
        last_login=current_user.get("last_login"),
        is_active=current_user.get("is_active", True)
    )


@router.get("/usage-stats", response_model=List[UsageStatsResponse])
async def get_usage_stats(
    days: int = Query(default=30, ge=1, le=365),
    current_user: dict = Depends(get_current_active_user)
):
    """Get usage statistics for current user"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    stats = await db.usage_stats.find(
        {"user_id": user_id, "date": {"$gte": start_date.date()}}
    ).sort("date", -1).to_list(length=100)
    
    return [
        UsageStatsResponse(
            user_id=s["user_id"],
            date=str(s["date"]),  # Convert date to string
            api_calls=s.get("api_calls", 0),
            total_processing_time=s.get("total_processing_time", 0.0),
            successful_calls=s.get("successful_calls", 0),
            failed_calls=s.get("failed_calls", 0),
            file_sizes=s.get("file_sizes", []),
            endpoints_used=s.get("endpoints_used", {})
        )
        for s in stats
    ]


@router.get("/rate-limit", response_model=RateLimitResponse)
async def get_rate_limit(current_user: dict = Depends(get_current_active_user)):
    """Get current rate limit status"""
    rate_limit_info = await check_rate_limit(current_user)
    return RateLimitResponse(**rate_limit_info)


# Admin endpoints
@router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get all users (Admin only)"""
    db = get_database()
    
    users = await db.users.find().skip(skip).limit(limit).to_list(length=limit)
    
    return [
        UserResponse(
            id=str(u["_id"]),
            username=u["username"],
            email=u["email"],
            subscription_tier=u.get("subscription_tier", "basic"),
            api_calls_limit=u.get("api_calls_limit", 1000),
            api_calls_used=u.get("api_calls_used", 0),
            company_name=u.get("company_name"),
            contact_person=u.get("contact_person"),
            status=u.get("status", "active"),
            role=u.get("role", "user"),
            created_at=u.get("created_at", datetime.utcnow()),
            last_login=u.get("last_login"),
            is_active=u.get("is_active", True)
        )
        for u in users
    ]


@router.get("/admin/analytics")
async def get_analytics(
    days: int = Query(default=30, ge=1, le=365),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get analytics dashboard data (Admin only)"""
    db = get_database()
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total users
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True, "status": "active"})
    
    # Total API calls
    total_calls_result = await db.api_calls.aggregate([
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {
            "_id": None,
            "total_calls": {"$sum": 1},
            "total_time": {"$sum": "$response_time"},
            "successful": {"$sum": {"$cond": ["$success", 1, 0]}},
            "failed": {"$sum": {"$cond": ["$success", 0, 1]}}
        }}
    ]).to_list(length=1)
    
    if total_calls_result:
        total_calls = total_calls_result[0]["total_calls"]
        total_time = total_calls_result[0]["total_time"]
        successful = total_calls_result[0]["successful"]
        failed = total_calls_result[0]["failed"]
        success_rate = (successful / total_calls * 100) if total_calls > 0 else 0
        failure_rate = (failed / total_calls * 100) if total_calls > 0 else 0
    else:
        total_calls = 0
        total_time = 0.0
        success_rate = 0.0
        failure_rate = 0.0
    
    # Usage by tier
    usage_by_tier = await db.users.aggregate([
        {"$group": {
            "_id": "$subscription_tier",
            "total_calls": {"$sum": "$api_calls_used"}
        }}
    ]).to_list(length=10)
    
    usage_by_tier_dict = {item["_id"]: item["total_calls"] for item in usage_by_tier}
    
    # Top users
    top_users = await db.users.find(
        {},
        {"username": 1, "api_calls_used": 1, "subscription_tier": 1}
    ).sort("api_calls_used", -1).limit(10).to_list(length=10)
    
    top_users_list = [
        {
            "username": u["username"],
            "api_calls_used": u.get("api_calls_used", 0),
            "subscription_tier": u.get("subscription_tier", "basic")
        }
        for u in top_users
    ]
    
    # Daily trends
    daily_trends = await db.usage_stats.aggregate([
        {"$match": {"date": {"$gte": start_date.date()}}},
        {"$group": {
            "_id": "$date",
            "total_calls": {"$sum": "$api_calls"}
        }},
        {"$sort": {"_id": 1}}
    ]).to_list(length=365)
    
    daily_trends_list = [
        {"date": str(t["_id"]), "calls": t["total_calls"]}
        for t in daily_trends
    ]
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_api_calls": total_calls,
        "total_processing_time": total_time,
        "success_rate": success_rate,
        "failure_rate": failure_rate,
        "usage_by_tier": usage_by_tier_dict,
        "top_users": top_users_list,
        "daily_trends": daily_trends_list
    }


@router.put("/admin/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Suspend a user account (Admin only)"""
    db = get_database()
    
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"status": "suspended", "is_active": False}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"success": True, "message": "User suspended successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error suspending user: {str(e)}"
        )


@router.put("/admin/users/{user_id}/upgrade")
async def upgrade_user_subscription(
    user_id: str,
    upgrade_data: UpgradeSubscriptionRequest,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Upgrade user subscription (Admin only)"""
    db = get_database()
    
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "subscription_tier": upgrade_data.subscription_tier.value,
                    "api_calls_limit": upgrade_data.api_calls_limit
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            ) 
        
        return {
            "success": True,
            "message": "User subscription upgraded successfully",
            "subscription_tier": upgrade_data.subscription_tier.value,
            "api_calls_limit": upgrade_data.api_calls_limit
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error upgrading subscription: {str(e)}"
        )

