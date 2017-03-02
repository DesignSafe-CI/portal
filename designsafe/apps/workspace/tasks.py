from __future__ import absolute_import

from dateutil.tz import tzoffset
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.conf import settings
from designsafe.apps.signals.signals import generic_event
from designsafe.libs.elasticsearch.api import Object
from dsapi.agave import utils as agave_utils
from dsapi.agave.daos import AgaveFolderFile, FileManager
from designsafe.apps.api.notifications.models import Notification
from agavepy.agave import Agave, AgaveException
from celery import shared_task
from requests import ConnectionError, HTTPError

import datetime
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

        logger.debug('job: {}'.format(job))

        try:
        #job['submitTime'] is a datetime object
            job['submitTime']=str(job['submitTime'])
            job['endTime']=str(job['endTime'])
        except KeyError as e:
            pass #unfinished jobs won't have an endTime


        job_status = job['status']
        if job_status == 'FINISHED':
            job_status = 'INDEXING'

        job_name = job['name']

        event_data = {
            Notification.EVENT_TYPE: 'job',
            Notification.STATUS: '',
            Notification.USER: username,
            Notification.MESSAGE: '',
            Notification.EXTRA: job
            # Notification.EXTRA:{
            #     'job_name': job_name,
            #     'job_id': job['id'],
            #     'job_owner': job['owner'],
            #     'job_status': job_status,
            #     'archive_path': job['archivePath'],
            # }
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
            #generic_event.send_robust(None, event_type='job', event_data=event_data,
            #                          event_users=[username])

        elif job_status == 'INDEXING':
            # end state, start indexing outputs
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))

            # notify
            event_data[Notification.STATUS] = Notification.INFO
            event_data[Notification.MESSAGE] = 'Job %s status has been updated to INDEXING' % (job_name, )
            event_data[Notification.OPERATION] = 'job_status_update'
            logger.debug('ws event_data: {}'.format(event_data))
            n = Notification.objects.create(**event_data)
            n.save()
            #generic_event.send_robust(None, event_type='job', event_data=event_data,
            #                          event_users=[username])

            try:
                logger.debug('Preparing to Index Job Output job=%s' % job)
                index_job_outputs(user, job)
                logger.debug('Finished Indexing Job Output job=%s' % job)

                logger.debug('archivePath: {}'.format(job['archivePath']))
                target_path = reverse('designsafe_data:data_browser', args=['agave', archive_id])

                event_data[Notification.STATUS] = Notification.SUCCESS
                event_data[Notification.EXTRA]['job_status'] = 'FINISHED'
                event_data[Notification.EXTRA]['target_path'] = target_path
                event_data[Notification.MESSAGE] = 'Job "%s" has finished!' % (job_name, )
                event_data[Notification.OPERATION] = 'job_finished'

                n = Notification.objects.create(**event_data)
                n.save()
                #event_data['action_link'] = {
                #    'label': 'View Output',
                #    'value': '%s#%s' % (reverse('designsafe_data:my_data'), db_hash)
                #}
                #event_data['toast'] = {
                #      'type': 'info',
                #      'msg': job_name + ' job outputs are available.'
                #}

                logger.debug('Event data with action link %s' % event_data)

                # notify
                #generic_event.send_robust(None, event_type='job', event_data=event_data,
                #                          event_users=[job['owner']])
            except Exception as e:
                logger.exception('Error indexing job output; scheduling retry')
                raise self.retry(exc=e, countdown=60, max_retries=3)

        elif current_status and current_status == job_status:
            # DO NOT notify, but still queue another watch task
            #watch_job_status.apply_async(args=[username, job_id],
            #                             kwargs={'current_status': job_status},
            #                             countdown=10)
            self.retry()
        else:
            # queue another watch task
            #watch_job_status.apply_async(args=[username, job_id],
            #                             kwargs={'current_status': job_status},
            #                             countdown=10)

            # notify
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))
            event_data[Notification.STATUS] = Notification.INFO
            event_data[Notification.MESSAGE] = 'Job "%s" status has been updated to %s.' % (job_name, job_status)
            event_data[Notification.OPERATION] = 'job_status_update'
            logger.debug('job: {}'.format(job))
            n = Notification.objects.create(**event_data)
            n.save()
            #generic_event.send_robust(None, event_type='job', event_data=event_data,
            #                          event_users=[username])
            self.retry(countdown=10)
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

@shared_task(bind=True)
def watch_job_status(self, username, job_id, current_status=None):
    try:
        user = get_user_model().objects.get(username=username)
        ag = user.agave_oauth.client
        job = ag.jobs.get(jobId=job_id)

        logger.debug('job: {}'.format(job))

        try:
        #job['submitTime'] is a datetime object
            job['submitTime']=str(job['submitTime'])
            job['endTime']=str(job['endTime'])
        except KeyError as e:
            pass #unfinished jobs won't have an endTime


        job_status = job['status']
        if job_status == 'FINISHED':
            job_status = 'INDEXING'

        job_name = job['name']

        event_data = {
            Notification.EVENT_TYPE: 'job',
            Notification.STATUS: '',
            Notification.USER: username,
            Notification.MESSAGE: '',
            Notification.EXTRA: job
            # Notification.EXTRA:{
            #     'job_name': job_name,
            #     'job_id': job['id'],
            #     'job_owner': job['owner'],
            #     'job_status': job_status,
            #     'archive_path': job['archivePath'],
            # }
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
            #generic_event.send_robust(None, event_type='job', event_data=event_data,
            #                          event_users=[username])

        elif job_status == 'INDEXING':
            # end state, start indexing outputs
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))

            # notify
            event_data[Notification.STATUS] = Notification.INFO
            event_data[Notification.MESSAGE] = 'Job %s status has been updated to INDEXING' % (job_name, )
            event_data[Notification.OPERATION] = 'job_status_update'
            logger.debug('ws event_data: {}'.format(event_data))
            n = Notification.objects.create(**event_data)
            n.save()
            #generic_event.send_robust(None, event_type='job', event_data=event_data,
            #                          event_users=[username])

            try:
                logger.debug('Preparing to Index Job Output job=%s' % job)
                index_job_outputs(user, job)
                logger.debug('Finished Indexing Job Output job=%s' % job)

                logger.debug('archivePath: {}'.format(job['archivePath']))
                target_path = reverse('designsafe_data:data_browser', args=['agave', archive_id])

                event_data[Notification.STATUS] = Notification.SUCCESS
                event_data[Notification.EXTRA]['job_status'] = 'FINISHED'
                event_data[Notification.EXTRA]['target_path'] = target_path
                event_data[Notification.MESSAGE] = 'Job "%s" has finished!' % (job_name, )
                event_data[Notification.OPERATION] = 'job_finished'

                n = Notification.objects.create(**event_data)
                n.save()
                #event_data['action_link'] = {
                #    'label': 'View Output',
                #    'value': '%s#%s' % (reverse('designsafe_data:my_data'), db_hash)
                #}
                #event_data['toast'] = {
                #      'type': 'info',
                #      'msg': job_name + ' job outputs are available.'
                #}

                logger.debug('Event data with action link %s' % event_data)

                # notify
                #generic_event.send_robust(None, event_type='job', event_data=event_data,
                #                          event_users=[job['owner']])
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
            event_data[Notification.STATUS] = Notification.INFO
            event_data[Notification.MESSAGE] = 'Job "%s" status has been updated to %s.' % (job_name, job_status)
            event_data[Notification.OPERATION] = 'job_status_update'
            logger.debug('job: {}'.format(job))
            n = Notification.objects.create(**event_data)
            n.save()
            #generic_event.send_robust(None, event_type='job', event_data=event_data,
            #                          event_users=[username])
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
