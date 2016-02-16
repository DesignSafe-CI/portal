from __future__ import absolute_import

from celery import shared_task
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from dsapi.agave.tools.bin.walker import fs_walk, get_or_create_from_file
from agavepy.agave import Agave
import logging

logger = logging.getLogger(__name__)


@shared_task
def index_job_outputs(data):
    job_owner = data['job_owner']
    job_id = data['job_id']

    try:
        user = get_user_model().objects.get(username=job_owner)
        if user.agave_oauth.expired:
            user.agave_oauth.refresh()
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=user.agave_oauth.token.access_token)

        job = ag.jobs.get(jobId=job_id)
        system_id = job['archiveSystem']
        archive_path = job['archivePath']

        for f in fs_walk(ag, system_id, archive_path):
            get_or_create_from_file(ag, f)

    except ObjectDoesNotExist:
        logger.exception('Unable to locate local user=%s' % job_owner)
