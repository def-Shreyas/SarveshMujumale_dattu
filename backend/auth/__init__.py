"""
Authentication package for Safety Data Analysis API
"""
from auth.database import connect_to_mongo, close_mongo_connection, get_database
from auth.dependencies import get_current_user, get_current_active_user, get_current_admin_user, track_api_usage
from auth.models import (
    LoginRequest,
    CreateUserRequest,
    UserResponse,
    TokenResponse,
    UsageStatsResponse,
    RateLimitResponse,
    SubscriptionTier,
    UserRole,
    UserStatus
)
from auth.auth_utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    get_subscription_limits
)
from auth.rate_limiter import check_rate_limit, check_file_size_limit

__all__ = [
    "connect_to_mongo",
    "close_mongo_connection",
    "get_database",
    "get_current_user",
    "get_current_active_user",
    "get_current_admin_user",
    "track_api_usage",
    "LoginRequest",
    "CreateUserRequest",
    "UserResponse",
    "TokenResponse",
    "UsageStatsResponse",
    "RateLimitResponse",
    "SubscriptionTier",
    "UserRole",
    "UserStatus",
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "decode_access_token",
    "get_subscription_limits",
    "check_rate_limit",
    "check_file_size_limit",
]



