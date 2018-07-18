from django.conf import settings
from agavepy.agave import Agave, AgaveException
from celery import shared_task
from requests import HTTPError
from django.contrib.auth import get_user_model
import logging


logger = logging.getLogger(__name__)

@shared_task(default_retry_delay=1*30, max_retries=3) # should it have multiple attemps?
def create_report(username):
    try:
        # user = get_user_model.objects.get(username=username) # am I gonna use user?
        logger.info(
            "Creating user report for user=%s on "
            "default storage systemId=%s",
            username,
            settings.AGAVE_STORAGE_SYSTEM
        )
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=settings.AGAVE_SUPER_TOKEN)

        ag.files.importData(
            systemId=settings.AGAVE_STORAGE_SYSTEM,
            filePath=username)

    except (HTTPError, AgaveException):
        logger.exception('Failed to create user report.',
                         extra={'user': username,
                                'systemId': settings.AGAVE_STORAGE_SYSTEM})


#this is how my task.py looks like
# having trouble: how to pass csv file here - I can add name, type
