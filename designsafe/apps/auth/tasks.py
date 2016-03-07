from django.conf import settings
from agavepy.agave import Agave, AgaveException
from dsapi.agave import utils as agave_utils
from designsafe.libs.elasticsearch.api import Object
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
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=settings.AGAVE_SUPER_TOKEN)
        body = {'action': 'mkdir', 'path': username}
        ag.files.manage(systemId=settings.AGAVE_STORAGE_SYSTEM,
                        filePath='/', body=json.dumps(body))

        # add dir to index
        home_dir = ag.files.list(systemId=settings.AGAVE_STORAGE_SYSTEM, filePath=username)
        home_dir_obj = agave_utils.get_folder_obj(agave_client=ag, file_obj=home_dir[0])
        o = Object(**home_dir_obj.to_dict())
        o.save()
    except (HTTPError, AgaveException):
        logger.exception('Failed to create home directory.',
                         extra={'user': username,
                                'systemId': settings.AGAVE_STORAGE_SYSTEM})
