from __future__ import absolute_import

import os
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from designsafe.apps.api.notifications.models import Notification
from agavepy.agave import AgaveException
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
        watch_job_status.apply_async(args=[username, response['id']], countdown=10, queue='api')
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

@shared_task(bind=True, max_retries=None)
def watch_job_status(self, username, job_id, current_status=None):

    try:

        user = get_user_model().objects.get(username=username)
        ag = user.agave_oauth.client
        job = ag.jobs.get(jobId=job_id)

        try:
        #job['submitTime'] is a datetime object
            job['submitTime']=str(job['submitTime'])
            job['endTime']=str(job['endTime'])
        except KeyError as e:
            pass #unfinished jobs won't have an endTime


        job_status = job['status']
        #if job_status == 'FINISHED':
        #    job_status = 'INDEXING'

        job_name = job['name']
        logger.debug(current_status)
        logger.debug(job_status)
        event_data = {
            Notification.EVENT_TYPE: 'job',
            Notification.STATUS: '',
            Notification.USER: username,
            Notification.MESSAGE: '',
            Notification.EXTRA: job
        }
        archive_id = 'agave/%s/%s' % (job['archiveSystem'], job['archivePath'].split('/'))

        if job_status == 'FAILED':
            # end state, no additional tasks; notify
            logger.debug('JOB FAILED: id=%s status=%s' % (job_id, job_status))
            event_data[Notification.STATUS] = Notification.ERROR
            event_data[Notification.MESSAGE] = 'Job "%s" Failed. Please try again...' % (job_name, )
            event_data[Notification.OPERATION] = 'job_failed'
            n = Notification.objects.create(**event_data)
            n.save()

        elif job_status == 'FINISHED':
            # end state, start indexing outputs
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))


            logger.debug('archivePath: {}'.format(job['archivePath']))
            target_path = reverse('designsafe_data:data_depot')
            os.path.join(target_path, 'agave', archive_id.strip('/'))
            event_data[Notification.STATUS] = Notification.SUCCESS
            event_data[Notification.EXTRA]['job_status'] = 'FINISHED'
            event_data[Notification.EXTRA]['target_path'] = target_path
            event_data[Notification.MESSAGE] = 'Job "%s" has finished!' % (job_name, )
            event_data[Notification.OPERATION] = 'job_finished'

            n = Notification.objects.create(**event_data)
            n.save()
            logger.debug('Event data with action link %s' % event_data)

            try:
                logger.debug('Preparing to Index Job Output job=%s', job)
                index_job_outputs(user, job)
                logger.debug('Finished Indexing Job Output job=%s', job)

            except Exception as e:
                logger.exception('Error indexing job output; scheduling retry')
                #raise self.retry(exc=e, countdown=60)

        elif current_status and current_status == job_status:
            # DO NOT notify, but still queue another watch task

            self.retry(countdown=10, kwargs={'current_status': job_status})
        else:
            # notify
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))
            event_data[Notification.STATUS] = Notification.INFO
            event_data[Notification.MESSAGE] = 'Job "%s" status has been updated to %s.' % (job_name, job_status)
            event_data[Notification.OPERATION] = 'job_status_update'
            n = Notification.objects.create(**event_data)
            n.save()
            self.retry(countdown=10, kwargs={'current_status': job_status})

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

    from designsafe.apps.api.data.agave.filemanager import FileManager as AgaveFileManager
    mgr = AgaveFileManager(user)
    mgr.indexer.index(system_id, archive_path, user.username,
                      full_indexing = True, pems_indexing = True,
                      index_full_path = True)
