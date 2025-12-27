import smtplib
from email.message import EmailMessage

SMTP_HOST = "smtp.hostinger.com"
SMTP_PORT = 587
SMTP_USER = "info.dattu@gurumaulient.com"
SMTP_PASS = "Pasaydan@2011"

msg = EmailMessage()
msg["From"] = SMTP_USER
msg["To"] = SMTP_USER
msg["Subject"] = "SMTP Test"
msg.set_content("This is a test email from Python")

with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
    server.starttls()
    server.login(SMTP_USER, SMTP_PASS)
    server.send_message(msg)

print("Email sent successfully")
