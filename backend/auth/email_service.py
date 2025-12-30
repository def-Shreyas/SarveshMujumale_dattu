import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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
        return

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
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")


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