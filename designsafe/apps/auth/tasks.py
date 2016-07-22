from django.conf import settings
from agavepy.agave import Agave, AgaveException
from dsapi.agave.daos import FileManager
from celery import shared_task
from requests import HTTPError
import logging
import json


logger = logging.getLogger(__name__)


@shared_task
def check_or_create_agave_home_dir(username):
    logger.info("Checking home directory for user=%s on default storage systemId=%s" % (
        username, settings.AGAVE_STORAGE_SYSTEM))
    try:
        # TODO should use DS Files API for this
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
