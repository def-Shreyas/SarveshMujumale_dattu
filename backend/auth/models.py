"""
Pydantic models for authentication and user management
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SubscriptionTier(str, Enum):
    """Subscription tier enumeration"""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    USER = "user"


class UserStatus(str, Enum):
    """User status enumeration"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


# Request Models
class LoginRequest(BaseModel):
    """Login request model"""
    username: str
    password: str


class CreateUserRequest(BaseModel):
    """Create user request model (Admin only)"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: Optional[str] = None
    subscription_tier: SubscriptionTier = SubscriptionTier.BASIC
    api_calls_limit: int = Field(default=1000, ge=-1)  # -1 for unlimited
    company_name: Optional[str] = None
    contact_person: Optional[str] = None


class UpgradeSubscriptionRequest(BaseModel):
    """Upgrade subscription request model"""
    subscription_tier: SubscriptionTier
    api_calls_limit: int = Field(ge=-1)


# Response Models
class UserResponse(BaseModel):
    """User response model"""
    id: str
    username: str
    email: str
    subscription_tier: SubscriptionTier
    api_calls_limit: int
    api_calls_used: int
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    status: UserStatus
    role: UserRole
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class UsageStatsResponse(BaseModel):
    """Usage statistics response model"""
    user_id: str
    date: str  # Date as string (YYYY-MM-DD format)
    api_calls: int
    total_processing_time: float
    successful_calls: int
    failed_calls: int
    file_sizes: List[int]
    endpoints_used: Dict[str, int]


class RateLimitResponse(BaseModel):
    """Rate limit response model"""
    api_calls_limit: int
    api_calls_used: int
    api_calls_remaining: int
    daily_limit: int
    daily_used: int
    daily_remaining: int
    monthly_limit: int
    monthly_used: int
    monthly_remaining: int
    subscription_tier: SubscriptionTier


class AnalyticsResponse(BaseModel):
    """Analytics response model"""
    total_users: int
    active_users: int
    total_api_calls: int
    total_processing_time: float
    success_rate: float
    failure_rate: float
    usage_by_tier: Dict[str, int]
    top_users: List[Dict[str, Any]]
    daily_trends: List[Dict[str, Any]]

