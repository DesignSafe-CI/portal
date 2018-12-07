from django.http.response import HttpResponseBadRequest
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.sessions.models import Session
from django.conf import settings

from celery import shared_task
from requests import ConnectionError, HTTPError
from agavepy.agave import Agave, AgaveException

from designsafe.apps.api.notifications.models import Notification

from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin
from designsafe.apps.api.exceptions import ApiException

from designsafe.apps.workspace.tasks import handle_webhook_request

import json
import logging

logger = logging.getLogger(__name__)



class JobsWebhookView(JSONResponseMixin, BaseApiView):
    """
    Dispatches notifications when receiving a POST request from the Agave
    webhook service.

    """

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(JobsWebhookView, self).dispatch(*args, **kwargs)

    def get(self, request, *args, **kwargs):
        return HttpResponse(settings.WEBHOOK_POST_URL.strip('/') + '/api/notifications/wh/jobs/')

    def post(self, request, *args, **kwargs):
        """
        Calls handle_webhook_request on webhook JSON body
        to notify the user of the progress of the job.

        """

        job = json.loads(request.body)

        handle_webhook_request(job)
        return HttpResponse('OK')


class FilesWebhookView(SecureMixin, JSONResponseMixin, BaseApiView):
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(FilesWebhookView, self).dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        notification = json.loads(request.body)
        logger.debug(notification)

        return HttpResponse('OK')
