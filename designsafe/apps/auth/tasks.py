from django.conf import settings
from agavepy.agave import Agave, AgaveException
from dsapi.agave.daos import FileManager
from celery import shared_task
from requests import HTTPError
from django.contrib.auth import get_user_model
import datetime
import logging
import json


logger = logging.getLogger(__name__)


@shared_task(default_retry_delay=1*30, max_retries=3)
def check_or_create_agave_home_dir(username):
    logger.info("Checking home directory for user=%s on default storage systemId=%s" % (
        username, settings.AGAVE_STORAGE_SYSTEM))
    try:
        # TODO should use DS Files API for this
        user = get_user_model().objects.get(username=username)
        if datetime.datetime.now().date() == user.date_joined.date():
            ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                       token=settings.AGAVE_SUPER_TOKEN)
            body = {'action': 'mkdir', 'path': username}
            ag.files.manage(systemId=settings.AGAVE_STORAGE_SYSTEM,
                            filePath='', body=body)

            # add dir to index
            fm = FileManager(agave_client=ag)
            fm.index(settings.AGAVE_STORAGE_SYSTEM, username, username, levels=1)

    except (HTTPError, AgaveException):
        logger.exception('Failed to create home directory.',
                         extra={'user': username,
                                'systemId': settings.AGAVE_STORAGE_SYSTEM})
