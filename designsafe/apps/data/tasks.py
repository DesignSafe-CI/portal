from __future__ import absolute_import

from celery import shared_task
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from dsapi.agave.utils import fs_walk, get_folder_obj
from designsafe.libs.elasticsearch.api import Object
from agavepy.agave import Agave
import logging

logger = logging.getLogger(__name__)


@shared_task
def index_job_outputs(data):
    logger.debug('Preparing to index Job outputs: %s' % data)

    job_owner = data['job_owner']
    job_id = data['job_id']

    if data['status'] in ['FINISHED', 'FAILED']:
        try:
            user = get_user_model().objects.get(username=job_owner)
            if user.agave_oauth.expired:
                user.agave_oauth.refresh()
            ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                       token=user.agave_oauth.token['access_token'])
            job = ag.jobs.get(jobId=job_id)
            system_id = job['archiveSystem']
            archive_path = job['archivePath']
            for f in fs_walk(agave_client=ag, system_id=system_id, folder=archive_path):
                fo = get_folder_obj(agave_client=ag, file_obj=f)
                o = Object.get(id=fo.uuid, ignore=404)
                if o is None:
                    o = Object(**fo.to_dict())
                    o.save()
                else:
                    fo.deleted = False
                    o.update_from_dict(**fo.to_dict())

        except ObjectDoesNotExist:
            logger.exception('Unable to locate local user=%s' % job_owner)
