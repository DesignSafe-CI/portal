""" Celery tasks for user onboarding and other user-related tasks. """

import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from celery import shared_task
from pytas.http import TASClient
from designsafe.apps.api.notifications.models import Notification
logger = logging.getLogger(__name__)


@shared_task(default_retry_delay=30, max_retries=3)
def new_user_alert(username):
    user = get_user_model().objects.get(username=username)
    send_mail(
        "New User in DesignSafe, need Slack",
        "Username: "
        + user.username
        + "\n"
        + "Email: "
        + user.email
        + "\n"
        + "Name: "
        + user.first_name
        + " "
        + user.last_name
        + "\n"
        + "Id: "
        + str(user.id)
        + "\n",
        settings.DEFAULT_FROM_EMAIL,
        settings.NEW_ACCOUNT_ALERT_EMAILS.split(","),
    )

    # Auto-add user to TRAM allocation
    # tram_headers = {"tram-services-key": settings.TRAM_SERVICES_KEY}
    # tram_body = {"project_id": settings.TRAM_PROJECT_ID,
    #              "email": user.email}
    # tram_resp = requests.post(f"{settings.TRAM_SERVICES_URL}/project_invitations/create",
    #                              headers=tram_headers,
    #                             json=tram_body,
    #                              timeout=15)
    # tram_resp.raise_for_status()


@shared_task()
def clear_old_notifications():
    """Delete notifications older than 30 days to prevent them cluttering the db."""
    time_cutoff = datetime.now() - timedelta(days=30)
    Notification.objects.filter(datetime__lte=time_cutoff).delete()


@shared_task(bind=True, max_retries=3)
def update_institution_from_tas(self, username):
    user_model = get_user_model().objects.get(username=username)
    try:
        tas_model = TASClient().get_user(username=username)
    except Exception as exc:
        raise self.retry(exc=exc)
    user_model.profile.institution = tas_model.get("institution", None)
    user_model.profile.save()
