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


@shared_task
def submit_job(request, username, job_post, retry=1):
    logger.info('Submitting job for user=%s: %s' % (username, job_post))

    try:
        user = get_user_model().objects.get(username=username)
        token = user.agave_oauth
        if token.expired:
            token.refresh()
        agave = Agave(api_server=settings.AGAVE_TENANT_BASEURL, token=token.access_token)
        response = agave.jobs.submit(body=job_post)
        logger.debug('Job Submission Response: {}'.format(response))

        # watch job status
        watch_job_status.apply_async(args=[username, response['id']], countdown=10)
        return response

    except ConnectionError as e:
        logger.error('ConnectionError while submitting job: %s' % e.message,
                     extra={'job': job_post})
        logger.info('Retry %s for job submission %s' % (retry, job_post))
        retry += 1
        submit_job.apply_async(args=[username, job_post], countdown=2**retry)
        raise JobSubmitError(status='error',
                             status_code=500,
                             message='We were unable to submit your job at this time due '
                                     'to a Job Service Interruption. Your job will be '
                                     'automatically resubmitted when the Job Service is '
                                     'available.')

    except HTTPError as e:
        logger.error('HTTPError while submitting job: %s' % e.message,
                       extra={'job': job_post})
        if e.response.status_code >= 500:
            logger.info('Retry %s for job submission %s' % (retry, job_post))
            retry += 1
            submit_job.apply_async(args=[username, job_post], countdown=2**retry)
            raise JobSubmitError(
                status='error',
                status_code=e.response.status_code,
                message='We were unable to submit your job at this time due '
                        'to a Job Service Interruption. Your job will be '
                        'automatically resubmitted when the Job Service is '
                        'available.')

        err_resp = e.response.json()
        err_resp['status_code'] = e.response.status_code
        logger.warning(err_resp)
        raise JobSubmitError(**err_resp)


@shared_task
def watch_job_status(username, job_id, current_status=None, retry=0):
    try:
        user = get_user_model().objects.get(username=username)
        if user.agave_oauth.expired:
            user.agave_oauth.refresh()
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=user.agave_oauth.token['access_token'])
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
                logger.debug('Event data with action link %s' % event_data)

                # notify
                generic_event.send_robust(None, event_type='job', event_data=event_data,
                                          event_users=[job['owner']])
            except:
                logger.exception('Error indexing job output; scheduling retry')
                retry += 1
                watch_job_status.apply_async(args=[username, job_id],
                                             kwargs={'retry': retry,
                                                     'current_status': 'FINISHED'},
                                             countdown=2**retry)

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
            retry += 1
            if retry > 10:
                logger.error('Agave Job Status max retries exceeded for job=%s' % job)
            else:
                logger.warning('Agave API error. Retry number %s...' % retry)
                watch_job_status.apply_async(args=[username, job_id],
                                             kwargs={'retry': retry},
                                             countdown=2**retry)

    except AgaveException:
        retry += 1
        if retry > 10:
            logger.error('Agave Job Status max retries exceeded for job=%s' % job)
        else:
            logger.warning('Agave API error. Retry number %s...' % retry)
            watch_job_status.apply_async(args=[username, job_id],
                                         kwargs={'retry': retry},
                                         countdown=2**retry)


def index_job_outputs(user, job):
    if user.agave_oauth.expired:
        user.agave_oauth.refresh()
    ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
               token=user.agave_oauth.access_token)
    system_id = job['archiveSystem']
    archive_path = job['archivePath']
   
    mgr = FileManager(ag)
    mgr.index(system_id, archive_path, user.username) 

# @shared_task
# def subscribe_job_notification(request, agave, job_id):
#     url=request.build_absolute_uri(reverse('jobs_webhook'))+'?uuid=${UUID}&status=${STATUS}&job_id=${JOB_ID}&event=${EVENT}&system=${JOB_SYSTEM}&job_name=${JOB_NAME}&job_owner=${JOB_OWNER}'
#     logger.info('job notification url: {}'.format(url))
#
#     d = {
#         "url" : url,
#         "event" : "*",
#         "associatedUuid" : job_id,
#         "persistent": True
#     }
#
#     try:
#       subscribe = agave.notifications.add(body=json.dumps(d))
#     except (requests.exceptions.ConnectionError, requests.exceptions.HTTPError) as e:
#         logger.debug('Job Notification Subscription Task HTTPError {0}: {1}'.format(e.response.status_code, e.__class__))
#         submit_job.retry(exc=e("Agave is currently down. Your notification will be created when it returns."), max_retries=None)
#
#     logger.info('agave subs: {}'.format(subscribe))
#
#
# #just for testing
# def mock_agave_notification():
#     import requests
#     r = requests.post('http://192.168.99.100:8000/webhooks/jobs/', data={"job_id":'1234512345', "event":"test", "job_name":'test name', "job_owner": 'mlm55', "status":"test status", "archivePath":"test/path"})
