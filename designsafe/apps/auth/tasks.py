from agavepy.agave import Agave, AgaveException
from celery import shared_task
from django.conf import settings
import logging
import json


logger = logging.getLogger(__name__)


@shared_task
def check_or_create_agave_home_dir(username):
    logger.info("Checking home directory for user=%s on default storage systemId=%s" % (
        username, settings.AGAVE_STORAGE_SYSTEM))
    try:
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=settings.AGAVE_SUPER_TOKEN)
        body = {'action': 'mkdir', 'path': username}
        ag.files.manage(systemId=settings.AGAVE_STORAGE_SYSTEM,
                        filePath='/',
                        body=json.dumps(body))
    except AgaveException:
        logger.exception('Failed to create home directory for user=%s' % username)
