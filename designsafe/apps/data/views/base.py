from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from .mixins import SecureMixin, AgaveMixin, JSONResponseMixin
from django.views.generic.base import View
from django.http import HttpResponse
from requests.exceptions import ConnectionError, HTTPError
import logging

logger = logging.getLogger(__name__)

# Create your views here.
class BaseView(SecureMixin, JSONResponseMixin, AgaveMixin, View):
    def __init__(self, **kwargs):
        self.api_vars = None
        self.agave_client = None
        super(BaseView, self).__init__(**kwargs)

    def dispatch(self, request, *args, **kwargs):
        try:
            return super(BaseView, self).dispatch(request, *args, **kwargs)
        except (ConnectionError, HTTPError) as e:
            logger.error('{}'.format(e.message), exc_info = True, extra = self.api_vars.as_json())
            return HttpResponse(e.message, status = 400)

    def get_context_data(self, request, **kwargs):
        self.api_vars = self.get_api_vars(request, **kwargs)
        self.agave_client = self.get_agave_client(self.api_vars)
        context = {}
        return context
