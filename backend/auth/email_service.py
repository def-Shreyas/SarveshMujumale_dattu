import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USERNAME")
SMTP_PASS = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM")

# 🔐 Hard fail if config missing
if not SMTP_USER or not SMTP_PASS:
    raise RuntimeError("SMTP credentials missing. Check .env file")

def send_reset_email(to_email: str, reset_link: str):
    msg = EmailMessage()
    msg["Subject"] = "Reset your DATTU password"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email

    msg.set_content(f"""
Hello,

You requested a password reset for your DATTU account.

Click the link below to reset your password:
{reset_link}

This link expires in 30 minutes.

If you didn’t request this, please ignore this email.

— DATTU Support Team
""")

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)