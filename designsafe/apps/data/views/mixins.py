from django.views.generic.base import View as BaseView
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse, StreamingHttpResponse
from ..daos import APIVars
from agavepy.agave import Agave, AgaveException
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
    def get_api_vars(self, request, **kwargs):
        token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
        access_token = token.get('access_token', None)
        agave_url = url = getattr(settings, 'AGAVE_TENANT_BASEURL')
        #TODO: Getting the filesystem should check in which system is the user in or requesting.
        filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
        file_path = kwargs.get('file_path', None)
        av = APIVars(token = token, access_token = access_token, agave_url = agave_url, filesystem = filesystem, file_path = file_path, username = request.user.username)
        return av

    def get_agave_client(self, api_vars):
        if getattr(self, 'agave_client', None) is None:
            a = Agave(api_server = api_vars.agave_url, token = api_vars.access_token)
            setattr(self, 'agave_client', a)
            return a
        else:
            return self.agave_client

    def get_operation(self, a, op):
        o = reduce(getattr, op.split("."), a)
        return o

    def exec_operation(self, op, args):
        response = op(**args)
        return response

    def call_operation(self, operation, args):
        a = self.agave_client
        op = self.get_operation(a, operation)
        try:
            response = self.exec_operation(op, args)
        except AgaveException as e:
            raise HTTPError(e.message)
            response = None
        return response
     
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
