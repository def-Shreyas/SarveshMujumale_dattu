from auth.email_service import send_email
from auth.email_templates import notification_email_template

SUBJECTS = {
    "inactive": "We miss you at DATTU 👋",
    "tokens_exhausted": "Your API tokens are exhausted",
    "tokens_warning": "Your API tokens are running low",
    "subscription_ending": "Your subscription is ending soon",
    "subscription_ended": "Your subscription has ended",
    "all": "Important update from DATTU",
}

async def send_notification_email(email: str, scenario: str):
    subject = SUBJECTS.get(scenario, "DATTU Update")
    html = notification_email_template(scenario)

    await send_email(
        to=email,
        subject=subject,
        html=html,
    )