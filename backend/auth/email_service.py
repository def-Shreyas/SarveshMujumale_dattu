import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load env vars explicitly
load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USERNAME")
SMTP_PASS = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("SMTP_FROM")


def smtp_configured() -> bool:
    return all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS])


async def send_email(to: str, subject: str, html: str):
    """
    Generic SMTP sender (used by notifications)
    """
    if not smtp_configured():
        print(f"[EMAIL DISABLED] {to} | {subject}")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = FROM_EMAIL
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


# ✅ KEEP THIS — password reset depends on it
async def send_reset_email(email: str, reset_link: str):
    html = f"""
    <p>Hello,</p>
    <p>You requested a password reset.</p>
    <p><a href="{reset_link}">Click here to reset your password</a></p>
    <br/>
    <p>If you didn’t request this, please ignore.</p>
    <p>— Team DATTU</p>
    """

    await send_email(
        to=email,
        subject="Reset your DATTU password",
        html=html,
    )


async def send_user_credentials_email(email: str, username: str, password: str) -> bool:
    """Send user credentials (username and password) to the user's email"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }}
            .header {{
                background-color: #0B3D91;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: white;
                padding: 30px;
                border-radius: 0 0 5px 5px;
            }}
            .credentials-box {{
                background-color: #f0f0f0;
                border-left: 4px solid #0B3D91;
                padding: 15px;
                margin: 20px 0;
            }}
            .credential-item {{
                margin: 10px 0;
            }}
            .label {{
                font-weight: bold;
                color: #0B3D91;
            }}
            .value {{
                font-family: monospace;
                font-size: 14px;
                background-color: white;
                padding: 5px 10px;
                border-radius: 3px;
                display: inline-block;
                margin-left: 10px;
            }}
            .warning {{
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to DATTU</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>Your account has been successfully created. Below are your login credentials:</p>
                
                <div class="credentials-box">
                    <div class="credential-item">
                        <span class="label">Username:</span>
                        <span class="value">{username}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Password:</span>
                        <span class="value">{password}</span>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong>
                    <p>Please keep these credentials secure and do not share them with anyone. We recommend changing your password after your first login.</p>
                </div>
                
                <p>You can now log in to your DATTU account using the credentials above.</p>
                
                <p>If you have any questions or need assistance, please contact your administrator.</p>
                
                <div class="footer">
                    <p>— Team DATTU</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    return await send_email(
        to=email,
        subject="Your DATTU Account Credentials",
        html=html,
    )