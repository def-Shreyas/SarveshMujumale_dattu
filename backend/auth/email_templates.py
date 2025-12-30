def notification_email_template(scenario: str) -> str:
    templates = {
        "inactive": """
        <p>Hello 👋</p>
        <p>We noticed you haven’t been active on <strong>DATTU</strong> for a while.</p>
        <p>If you need help, our team is always here.</p>
        <br/>
        <p>— Team DATTU</p>
        """,

        "tokens_exhausted": """
        <p>Your API token quota has been fully used.</p>
        <p>Please contact your administrator to extend access.</p>
        <br/>
        <p>— Team DATTU</p>
        """,

        "tokens_warning": """
        <p>Your API token usage is nearing its limit.</p>
        <p>Please plan accordingly to avoid disruption.</p>
        <br/>
        <p>— Team DATTU</p>
        """,

        "subscription_ending": """
        <p>Your subscription is about to expire.</p>
        <p>Please renew to avoid service interruption.</p>
        <br/>
        <p>— Team DATTU</p>
        """,

        "subscription_ended": """
        <p>Your subscription has ended.</p>
        <p>Please contact your administrator to restore access.</p>
        <br/>
        <p>— Team DATTU</p>
        """,

        "all": """
        <p>This is an important update regarding your DATTU account.</p>
        <br/>
        <p>— Team DATTU</p>
        """
    }

    return templates.get(scenario, templates["all"])
