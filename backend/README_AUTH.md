# Safety Data Analysis API - Authentication System

## Overview

This document describes the JWT-based authentication system implemented for the Safety Data Analysis API. The system provides secure token-based authentication with admin-created user accounts, usage tracking, and analytics.

## Features

- **JWT Token Authentication**: Secure token-based authentication
- **Admin-Created Users**: Only admins can create user accounts
- **Usage Tracking**: Monitor API calls, processing time, and file sizes
- **Rate Limiting**: Prevent abuse with daily and monthly limits
- **Analytics Dashboard**: Comprehensive usage analytics for admins
- **Subscription Tiers**: Different limits for different user types
- **MongoDB Storage**: Scalable document-based storage

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# API Configuration
HOST=0.0.0.0
PORT=8000
API_BASE_URL=http://localhost:8000

# Database
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=safety_data_analysis

# JWT Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Google API (for Gemini)
GOOGLE_API_KEY=your_google_api_key_here

# Admin Account
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=change-this-admin-password
```

### 3. Start MongoDB

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URL in .env file
```

### 4. Initialize Admin User

```bash
python init_admin.py
```

This will create the admin user with the credentials specified in your `.env` file.

### 5. Run the Application

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication Endpoints

#### 1. Admin/User Login

```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "change-this-admin-password"
}
```

**Response:**

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "user_id",
    "username": "admin",
    "email": "admin@yourcompany.com",
    "subscription_tier": "enterprise",
    "api_calls_limit": -1,
    "api_calls_used": 0
  }
}
```

#### 2. Create User Account (Admin Only)

```bash
POST /auth/admin/create-user
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "username": "client_company",
  "email": "client@company.com",
  "password": "optional-password",
  "subscription_tier": "basic",
  "api_calls_limit": 1000,
  "company_name": "Client Company",
  "contact_person": "John Doe"
}
```

### Protected API Endpoints

All the following endpoints require authentication (Bearer token):

- `POST /upload` - Upload Excel file
- `POST /generate-report` - Generate safety analysis report
- `POST /generate-charts` - Generate charts
- `GET /report` - Get generated report
- `GET /charts` - List all charts
- `GET /charts/{chart_name}` - Get specific chart
- `GET /status` - Get system status

### User Management Endpoints

#### 1. Get User Profile

```bash
GET /auth/profile
Authorization: Bearer your-jwt-token
```

#### 2. Get Usage Statistics

```bash
GET /auth/usage-stats?days=30
Authorization: Bearer your-jwt-token
```

#### 3. Check Rate Limits

```bash
GET /auth/rate-limit
Authorization: Bearer your-jwt-token
```

### Admin Endpoints

#### 1. Get All Users

```bash
GET /auth/admin/users?skip=0&limit=100
Authorization: Bearer admin-jwt-token
```

#### 2. Get Analytics

```bash
GET /auth/admin/analytics?days=30
Authorization: Bearer admin-jwt-token
```

#### 3. Suspend User

```bash
PUT /auth/admin/users/{user_id}/suspend
Authorization: Bearer admin-jwt-token
```

#### 4. Upgrade User Subscription

```bash
PUT /auth/admin/users/{user_id}/upgrade
Authorization: Bearer admin-jwt-token
Content-Type: application/json

{
  "subscription_tier": "premium",
  "api_calls_limit": 5000
}
```

## Subscription Tiers

| Tier       | Daily Limit | Monthly Limit | File Size Limit |
| ---------- | ----------- | ------------- | --------------- |
| Free       | 10 calls    | 100 calls     | 5MB             |
| Basic      | 50 calls    | 1,000 calls   | 10MB            |
| Premium    | 200 calls   | 5,000 calls   | 25MB            |
| Enterprise | Unlimited   | Unlimited     | 50MB            |

## Usage Tracking

The system automatically tracks:

- **API Calls**: Number of requests per user
- **Processing Time**: Time taken to process each request
- **File Sizes**: Size of uploaded files
- **Success/Failure Rates**: Success and error rates
- **Endpoint Usage**: Which endpoints are used most
- **Daily/Monthly Statistics**: Aggregated usage data

## Rate Limiting

- **Monthly Limits**: Based on subscription tier
- **Daily Limits**: Prevents abuse
- **File Size Limits**: Prevents large file uploads

## Security Features

- **JWT Tokens**: Secure, stateless authentication
- **Password Hashing**: bcrypt encryption
- **Rate Limiting**: Prevents abuse
- **File Size Limits**: Prevents DoS attacks
- **Input Validation**: Pydantic models
- **Error Handling**: Secure error messages

## Database Schema

### Users Collection

```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string",
  "hashed_password": "string",
  "subscription_tier": "string",
  "api_calls_limit": "number",
  "api_calls_used": "number",
  "company_name": "string",
  "contact_person": "string",
  "status": "string",
  "role": "string",
  "created_at": "datetime",
  "last_login": "datetime",
  "is_active": "boolean"
}
```

### Usage Stats Collection

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "date": "date",
  "api_calls": "number",
  "total_processing_time": "number",
  "successful_calls": "number",
  "failed_calls": "number",
  "file_sizes": ["number"],
  "endpoints_used": { "endpoint": "count" },
  "created_at": "datetime"
}
```

### API Calls Collection

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "endpoint": "string",
  "method": "string",
  "status_code": "number",
  "response_time": "number",
  "file_size": "number",
  "timestamp": "datetime",
  "error_message": "string",
  "success": "boolean"
}
```

## Example Usage

### 1. Login and Get Token

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "change-this-admin-password"
  }'
```

### 2. Use Protected Endpoint

```bash
curl -X POST "http://localhost:8000/upload" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@sample.xlsx"
```

### 3. Create New User (Admin Only)

```bash
curl -X POST "http://localhost:8000/auth/admin/create-user" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "subscription_tier": "basic",
    "api_calls_limit": 1000
  }'
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB is running
   - Verify MONGODB_URL is correct
   - Check network connectivity

2. **Authentication Errors**
   - Verify JWT_SECRET_KEY is set
   - Check token expiration
   - Ensure user account is active

3. **Rate Limit Issues**
   - Check subscription tier limits
   - Verify usage tracking
   - Review rate limit configuration

## Security Best Practices

1. **Change Default Passwords**: Update admin credentials
2. **Secure JWT Secret**: Use a strong, random secret key
3. **Enable SSL**: Use HTTPS in production
4. **Database Security**: Secure MongoDB access
5. **Regular Updates**: Keep dependencies updated
6. **Monitor Usage**: Review analytics regularly



