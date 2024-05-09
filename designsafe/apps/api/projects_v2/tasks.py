"""Async tasks related to project creation/management."""

from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail

# pylint: disable=unused-import
from designsafe.apps.api.projects_v2.operations.project_system_operations import (
    add_user_to_project_async,
    remove_user_from_project_async,
)
from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata


@shared_task(max_retries=3, default_retry_delay=60)
def alert_sensitive_data(project_id, username):
    """
    contact project admins regarding publication of sensitive information
    """
    project = ProjectMetadata.get_project_by_id(project_id)
    admins = settings.PROJECT_ADMINS_EMAIL
    user = get_user_model().objects.get(username=username)

    for admin in admins:
        email_body = """
            <p>Hello,</p>
            <p>
                The following Field Research project has been created with the intent of publishing sensitive information:
                <br>
                <b>{prjID} - {title}</b>
            </p>
            <p>
                Contact PI:
                <br>
                {name} - {email}
            </p>
            <p>
                Link to Project:
                <br>
                <a href=\"{url}\">{url}</a>.
            </p>
            This is a programmatically generated message. Do NOT reply to this message.
            """.format(
            name=user.get_full_name(),
            email=user.email,
            title=project.value["title"],
            prjID=project_id,
            url=f"https://designsafe-ci.org/data/browser/projects/{project_id}",
        )

        send_mail(
            "DesignSafe PII Alert",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [admin],
            html_message=email_body,
        )
