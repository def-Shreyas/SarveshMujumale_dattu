"""
Initialize admin user in MongoDB
Run this script once to create the admin user
"""
import asyncio
import os
from dotenv import load_dotenv
from auth.database import connect_to_mongo, get_database
from auth.auth_utils import get_password_hash
from datetime import datetime

load_dotenv()


async def init_admin():
    """Initialize admin user"""
    await connect_to_mongo()
    db = get_database()
    
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@yourcompany.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "change-this-admin-password")
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"username": admin_username})
    
    if existing_admin:
        print(f"Admin user '{admin_username}' already exists.")
        return
    
    # Create admin user
    hashed_password = get_password_hash(admin_password)
    
    admin_doc = {
        "username": admin_username,
        "email": admin_email,
        "hashed_password": hashed_password,
        "subscription_tier": "enterprise",
        "api_calls_limit": -1,  # Unlimited
        "api_calls_used": 0,
        "company_name": "System Administration",
        "contact_person": "System Admin",
        "status": "active",
        "role": "admin",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "last_activity": None
    }
    
    result = await db.users.insert_one(admin_doc)
    print(f"Admin user created successfully!")
    print(f"Username: {admin_username}")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    print(f"\n⚠️  IMPORTANT: Change the admin password in production!")
    print(f"⚠️  Update ADMIN_PASSWORD in your .env file and run this script again.")


if __name__ == "__main__":
    asyncio.run(init_admin())

