from django.http.response import HttpResponseBadRequest
from django.core.urlresolvers import reverse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import render
from django.http import HttpResponse

from designsafe.apps.api.notifications.models import Notification

from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin
from designsafe.apps.api.exceptions import ApiException

import json

class JobsWebhookView(SecureMixin, JSONResponseMixin, BaseApiView):
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(JosWebhookView, self).dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        JOB_EVENT='job'
        logger.debug('request body: {}'.format(request.body))

        try:
            notification = json.loads(request.body)
            job_name = notification['name']
            status = notification['status']
            event = request.GET.get('event')
            job_id = request.GET.get('job_id')
            job_owner = notification['owner']
            archive_path = notification['archivePath']
        except ValueError as e: #for testing ->used when mocking agave notification
            job_name = request.POST.get('job_name')
            status = request.POST.get('status')
            event = request.POST.get('event')
            job_id = request.POST.get('job_id')
            job_owner = request.POST.get('job_owner')
            archive_path = request.POST.get('archivePath')

        logger.info('job_name: {}'.format(job_name))
        logger.info('event: {}'.format(event))
        logger.info('job_id: {}'.format(job_id))
        n = Notification(event_type = 'job',
                         status = 'INFO',
                         operation = event,
                         message = 'Job %s changed to %s' % (job_name, status),
                         user = job_owner,
                         extra = {'archive_path': archive_path,
                                  'job_id': job_id})
        n.save()

        return HttpResponse('OK')
        
class FilesWebhookView(SecureMixin, JSONResponseMixin, BaseApiView):
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(JosWebhookView, self).dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        notification = json.loads(request.body)
        logger.debug(notification)

        return HttpResponse('OK')
        
