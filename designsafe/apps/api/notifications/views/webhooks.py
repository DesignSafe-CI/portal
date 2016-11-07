from django.http.response import HttpResponseBadRequest
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import render
from django.http import HttpResponse

from celery import shared_task
from requests import ConnectionError, HTTPError
from agavepy.agave import Agave, AgaveException

from designsafe.apps.api.notifications.models import Notification

from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin
from designsafe.apps.api.exceptions import ApiException

import json
import logging

logger = logging.getLogger(__name__)

# class JobsWebhookView(SecureMixin, JSONResponseMixin, BaseApiView):
class JobsWebhookView(JSONResponseMixin, BaseApiView):
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(JobsWebhookView, self).dispatch(*args, **kwargs)

    @shared_task(bind=True)
    def post(self, request, *args, **kwargs):

        #don't need to parse everything
        # JOB_EVENT='job'
        # logger.debug('request body: {}'.format(request.body))

        # try:
        #     notification = json.loads(request.body)
        #     job_name = notification['name']
        #     status = notification['status']
        #     event = request.GET.get('event')
        #     job_id = request.GET.get('job_id')
        #     job_owner = notification['owner']
        #     archive_path = notification['archivePath']
        # except ValueError as e: #for testing ->used when mocking agave notification
        #     job_name = request.POST.get('job_name')
        #     status = request.POST.get('status')
        #     event = request.POST.get('event')
        #     job_id = request.POST.get('job_id')
        #     job_owner = request.POST.get('job_owner')
        #     archive_path = request.POST.get('archivePath')

        # logger.info('job_name: {}'.format(job_name))
        # logger.info('event: {}'.format(event))
        # logger.info('job_id: {}'.format(job_id))

        # n = Notification(event_type = 'job',
        #                  status = 'INFO',
        #                  operation = event,
        #                  message = 'Job %s changed to %s' % (job_name, status),
        #                  user = job_owner,
        #                  extra = notification)
        # n.save()

        # return HttpResponse('OK')

        # ----------------------
        try:
            body = json.loads(request.body)
            job = body['job']
            username = job['owner']
            job_id = job['id']

            user = get_user_model().objects.get(username=username)

            event_data = {
                Notification.EVENT_TYPE: 'job',
                Notification.STATUS: '',
                Notification.USER: username,
                Notification.MESSAGE: '',
                Notification.EXTRA: job
            }

            job_status = job['status']
            if job_status == 'FINISHED':
                job_status = event_data[Notification.EXTRA]['status'] = 'INDEXING'

            job_name = job['name']

            archive_id = 'agave/%s/%s' % (job['archiveSystem'], job['archivePath'].split('/'))

            if job_status == 'FAILED':
                # end state, no additional tasks; notify
                logger.debug('JOB FAILED: id=%s status=%s' % (job_id, job_status))
                event_data[Notification.STATUS] = Notification.ERROR
                event_data[Notification.MESSAGE] = 'Job "%s" Failed. Please try again...' % (job_name, )
                event_data[Notification.OPERATION] = 'job_failed'
                n = Notification.objects.create(**event_data)
                n.save()

            elif job_status == 'INDEXING':
                # end state, start indexing outputs
                logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))

                # notify
                event_data[Notification.STATUS] = Notification.INFO
                event_data[Notification.MESSAGE] = 'Job %s status has been updated to INDEXING' % (job_name, )
                logger.debug('ws event_data: {}'.format(event_data))
                n = Notification.objects.create(**event_data)
                n.save()

                try:
                    logger.debug('Preparing to Index Job Output job=%s' % job)
                    index_job_outputs(user, job)
                    logger.debug('Finished Indexing Job Output job=%s' % job)

                    logger.debug('archivePath: {}'.format(job['archivePath']))
                    target_path = reverse('designsafe_data:data_browser', args=['agave', archive_id])

                    event_data[Notification.STATUS] = Notification.SUCCESS
                    event_data[Notification.EXTRA]['status'] = 'FINISHED'
                    event_data[Notification.EXTRA]['target_path'] = target_path
                    event_data[Notification.MESSAGE] = 'Job "%s" has finished!' % (job_name, )
                    event_data[Notification.OPERATION] = 'job_finished'

                    n = Notification.objects.create(**event_data)
                    n.save()

                    logger.debug('Event data with action link %s' % event_data)

                except Exception as e:
                    logger.exception('Error indexing job output; scheduling retry')
                    raise self.retry(exc=e, countdown=60, max_retries=3)
            else:
                # notify
                logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))
                event_data[Notification.STATUS] = Notification.INFO
                event_data[Notification.MESSAGE] = 'Job "%s" status has been updated to %s.' % (job_name, job_status)
                event_data[Notification.OPERATION] = 'job_status_update'
                Notification.objects.create(**event_data)

        except ObjectDoesNotExist:
            logger.exception('Unable to locate local user account: %s' % username)

        return HttpResponse('OK')


def index_job_outputs(user, job):
    ag = user.agave_oauth.client
    system_id = job['archiveSystem']
    archive_path = job['archivePath']

    from designsafe.apps.api.data.agave.filemanager import FileManager as AgaveFileManager
    mgr = AgaveFileManager(user)
    mgr.indexer.index(system_id, archive_path, user.username,
                      full_indexing = True, pems_indexing = True,
                      index_full_path = True)


class FilesWebhookView(SecureMixin, JSONResponseMixin, BaseApiView):
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(FilesWebhookView, self).dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        notification = json.loads(request.body)
        logger.debug(notification)

        return HttpResponse('OK')

