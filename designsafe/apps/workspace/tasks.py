from __future__ import absolute_import

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.conf import settings
from designsafe.apps.signals.signals import generic_event
from designsafe.libs.elasticsearch.api import Object
from dsapi.agave import utils as agave_utils
from dsapi.agave.daos import AgaveFolderFile, FileManager
from agavepy.agave import Agave, AgaveException
from celery import shared_task
from requests import ConnectionError, HTTPError
import logging

logger = logging.getLogger(__name__)


class JobSubmitError(Exception):

    def __init__(self, *args, **kwargs):
        self.status = kwargs.pop('status', 'error')
        self.status_code = kwargs.pop('status_code', 500)
        self.message = kwargs.pop('message', None)

    def json(self):
        return {
            'status': getattr(self, 'status', 'error'),
            'message': getattr(self, 'message', None)
        }


def submit_job(request, username, job_post):
    logger.info('Submitting job for user=%s: %s' % (username, job_post))

    try:
        user = get_user_model().objects.get(username=username)
        agave = user.agave_oauth.client
        response = agave.jobs.submit(body=job_post)
        logger.debug('Job Submission Response: {}'.format(response))

        # watch job status
        watch_job_status.apply_async(args=[username, response['id']], countdown=10)
        return response

    except ConnectionError as e:
        logger.error('ConnectionError while submitting job: %s' % e.message,
                     extra={'job': job_post})
        raise JobSubmitError(status='error',
                             status_code=500,
                             message='We were unable to submit your job at this time due '
                                     'to a Job Service Interruption. Please try again later.')

    except HTTPError as e:
        logger.error('HTTPError while submitting job: %s' % e.message,
                       extra={'job': job_post})
        if e.response.status_code >= 500:
            raise JobSubmitError(
                status='error',
                status_code=e.response.status_code,
                message='We were unable to submit your job at this time due '
                        'to a Job Service Interruption. Please try again later.')

        err_resp = e.response.json()
        err_resp['status_code'] = e.response.status_code
        logger.warning(err_resp)
        raise JobSubmitError(**err_resp)


@shared_task(bind=True)
def watch_job_status(self, username, job_id, current_status=None):
    try:
        user = get_user_model().objects.get(username=username)
        ag = user.agave_oauth.client
        job = ag.jobs.get(jobId=job_id)

        job_status = job['status']
        if job_status == 'FINISHED':
            job_status = 'INDEXING'

        job_name = job['name']

        event_data = {
            'job_name': job_name,
            'job_id': job['id'],
            'event': job_status,
            'status': job_status,
            'archive_path': job['archivePath'],
            'job_owner': job['owner'],
            'html': [
                {'Job Name': job_name},
                {'Status': job_status},
            ]
        }

        if job_status == 'FAILED':
            # end state, no additional tasks; notify
            logger.debug('JOB FINALIZED: id=%s status=%s' % (job_id, job_status))
            generic_event.send_robust(None, event_type='job', event_data=event_data,
                                      event_users=[username])

        elif job_status == 'INDEXING':
            # end state, start indexing outputs
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))

            # notify
            generic_event.send_robust(None, event_type='job', event_data=event_data,
                                      event_users=[username])

            try:
                logger.debug('Preparing to Index Job Output job=%s' % job)
                index_job_outputs(user, job)
                logger.debug('Finished Indexing Job Output job=%s' % job)

                event_data['status'] = 'FINISHED'
                event_data['event'] = 'FINISHED'
                event_data['html'][1] = {'Status': 'FINISHED'}

                db_hash = job['archivePath'].replace(job['owner'], '')
                event_data['action_link'] = {
                    'label': 'View Output',
                    'value': '%s#%s' % (reverse('designsafe_data:my_data'), db_hash)
                }
                event_data['toast'] = {
                      'type': 'info',
                      'msg': job_name + ' job outputs are available.'
                }

                logger.debug('Event data with action link %s' % event_data)

                # notify
                generic_event.send_robust(None, event_type='job', event_data=event_data,
                                          event_users=[job['owner']])
            except Exception as e:
                logger.exception('Error indexing job output; scheduling retry')
                raise self.retry(exc=e, countdown=60, max_retries=3)

        elif current_status and current_status == job_status:
            # DO NOT notify, but still queue another watch task
            watch_job_status.apply_async(args=[username, job_id],
                                         kwargs={'current_status': job_status},
                                         countdown=10)
        else:
            # queue another watch task
            watch_job_status.apply_async(args=[username, job_id],
                                         kwargs={'current_status': job_status},
                                         countdown=10)

            # notify
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))
            generic_event.send_robust(None, event_type='job', event_data=event_data,
                                      event_users=[username])
    except ObjectDoesNotExist:
        logger.exception('Unable to locate local user account: %s' % username)

    except HTTPError as e:
        if e.response.status_code == 404:
            logger.warning('Job not found. Cancelling job watch.',
                           extra={'job_id': job_id})
        else:
            logger.warning('Agave API error. Retrying...')
            raise self.retry(exc=e, countdown=60, max_retries=10)

    except AgaveException as e:
        logger.warning('Agave API error. Retrying...')
        raise self.retry(exc=e, countdown=60, max_retries=10)


def index_job_outputs(user, job):
    ag = user.agave_oauth.client
    system_id = job['archiveSystem']
    archive_path = job['archivePath']

    mgr = FileManager(ag)
    mgr.index(system_id, archive_path, user.username)
