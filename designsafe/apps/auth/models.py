from django.conf import settings
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver

import logging
import requests

logger = logging.getLogger(__name__)

@receiver(user_logged_in)
def check_agave_home_dir(sender, user, request, **kwargs):
    """
    Attempts to create a home directory for the user on the default storage system. If the
    directory already exists, a HTTP 400 response will be returned.

    TODO: Wrap this in a celery task to prevent it from holding up login processing.
    """
    agave_base_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    default_storage_sys = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
    system_url = '%s/files/v2/media/system/%s/' % (agave_base_url, default_storage_sys)
    post_data = {'action':'mkdir', 'path': user.username}
    auth_header = {'Authorization': 'Bearer %s' % getattr(settings, 'AGAVE_SUPER_TOKEN')}

    logger.info("Checking home directory for user=%s on default storage systemId=%s" % (
        user.username, default_storage_sys))
    try:
        resp = requests.put(system_url, data=post_data, headers=auth_header)
    except Exception as e:
        logger.exception('Failed to create home directory for user=%s' % user.username)

    if not resp.status_code == 200:
        if resp.status_code == 400:
            logger.warn(resp.json())
        else:
            logger.error(resp.text)
