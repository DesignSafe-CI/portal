from agavepy.agave import Agave, AgaveException
from django.conf import settings
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
import logging
import json


logger = logging.getLogger(__name__)


@receiver(user_logged_in)
def check_agave_home_dir(sender, user, request, **kwargs):
    """
    Attempts to create a home directory for the user on the default storage system. If the
    directory already exists, a HTTP 400 response will be returned.

    TODO: Wrap this in a celery task to prevent it from holding up login processing.
    """
    logger.info("Checking home directory for user=%s on default storage systemId=%s" % (
        user.username, settings.AGAVE_STORAGE_SYSTEM))
    try:
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=settings.AGAVE_SUPER_TOKEN)
        body = {'action': 'mkdir', 'path': user.username}
        ag.files.manage(systemId=settings.AGAVE_STORAGE_SYSTEM,
                        filePath='/',
                        body=json.dumps(body))
    except AgaveException:
        logger.exception('Failed to create home directory for user=%s' % user.username)
