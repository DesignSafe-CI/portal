"""Utilities to email users/staff in response to project lifecycle changes."""

from typing import Optional
from django.conf import settings
from django.core.mail import send_mail


def send_project_permissions_alert(project_id: str, version: Optional[int], error: str):
    """
    Alert dev team when a project has encountered a permission error during publication.
    """
    prj_admins = settings.DEV_PROJECT_ADMINS_EMAIL
    for admin in prj_admins:
        email_body = f"""
            <p>Hello,</p>
            <p>
                The following project has encountered a permission error during publication:
                <br/>
                <b>{project_id} - revision {version}</b>
                <br/>
            </p>
            <p>
            The error is as follows:<br/>
            {error}
            </p>

            This is a programmatically generated message. Do NOT reply to this message.
            """

        send_mail(
            "DesignSafe Alert: Published Project has missing files/folders",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [admin],
            html_message=email_body,
        )
