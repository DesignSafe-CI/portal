from django.views.generic.base import View as BaseView
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse, StreamingHttpResponse
from agavepy.agave import Agave, AgaveException
from django.contrib.auth import get_user_model
from django.conf import settings
import datetime
import copy
import json
import logging
import requests
from requests.exceptions import ConnectionError, HTTPError

logger = logging.getLogger(__name__)

class AgaveMixin(object):
    """
    View mixin to catch APIs specific errors. This should not catch HTTP specific errors, 
    those should get handled in the corresponding verb method.
    """
    def __init__(self, **kwargs):
        self.token = None
        self.access_token = None
        self.agave_url = None
        self.agave_client = None
        super(AgaveMixin, self).__init__(**kwargs)

    def set_agave_client(self, api_server = None, token = None, **kwargs):
        if getattr(self, 'agave_client', None) is None:
            a = Agave(api_server = api_server, token = token, **kwargs)
            setattr(self, 'agave_client', a)
            return a
        else:
            return self.agave_client

    def set_context_props(self, request, **kwargs):
        if request.user.is_authenticated():
            me = get_user_model().objects.get(username=request.user.username)
        else:
            me = get_user_model().objects.get(username='envision')
        # shouldn't be necessary; AgaveTokenRefreshMiddleware does this...
        if me.agave_oauth.expired:
            me.agave_oauth.refresh()
        self.token = me.agave_oauth
        self.access_token = self.token.access_token
        self.agave_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
        self.set_agave_client(api_server = self.agave_url, token = self.access_token)

class JSONResponseMixin(object):
    """
    View mixin to return a JSON response. 
    We're building one so we can put any extra code in here.
    """

    def render_to_json_response(self, context, **response_kwargs):
        response_kwargs['status'] = response_kwargs.get('status', 200)
        response_kwargs['content_type'] = 'application/json'
        return HttpResponse(json.dumps(context, cls=DjangoJSONEncoder), **response_kwargs)

class SecureMixin(object):
    """
    View mixin to use login_required
    """
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(SecureMixin, self).dispatch(request, *args, **kwargs)
