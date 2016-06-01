from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse
from django.shortcuts import resolve_url
from .mixins import SecureMixin, JSONResponseMixin
from django.views.generic.base import View, TemplateView
from requests.exceptions import ConnectionError, HTTPError
from dsapi.agave.daos import shared_with_me
from django.contrib.auth import get_user_model
from agavepy.agave import Agave, AgaveException
from django.conf import settings

from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.filemanager import FileManager as AgaveFileManager
from designsafe.apps.api.data.agave.public_filemanager import FileManager as PublicFileManager
from designsafe.apps.api.data.box.filemanager import FileManager as BoxFileManager
from designsafe.apps.api.data.sources import SourcesApi

import logging
import json

from designsafe.apps.notifications.views import get_number_unread_notifications

logger = logging.getLogger(__name__)

# Create your views here.
class BaseView(View):
    filesystem = None
    def __init__(self, **kwargs):
        self.token = None
        self.access_token = None
        self.agave_url = None
        self.agave_client = None
        self.filesystem = None
        self.file_path = None
        self.force_homedir = True
        self.special_dir = None
        self.is_public = False
        super(BaseView, self).__init__(**kwargs)

    def set_agave_client(self, api_server = None, token = None, **kwargs):
        if getattr(self, 'agave_client', None) is None:
            a = Agave(api_server = api_server, token = token, **kwargs)
            setattr(self, 'agave_client', a)
            return a
        else:
            return self.agave_client

    def set_agave_props(self, request, **kwargs):
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

    def set_context_props(self, request, **kwargs):
        #import ipdb; ipdb.set_trace();
        #TODO: Getting the filesystem should check in which system is the user in or requesting
        filesystem = kwargs.get('filesystem', self.filesystem)
        settings_fs = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
        self.file_path = kwargs.get('file_path', None)

        self.is_public = False
        if filesystem == 'default':
            self.filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
            self.force_homedir = True
        else:
            self.filesystem = filesystem
            self.force_homedir = False
            if 'public' in self.filesystem:
                self.is_public = True
        if self.file_path is None or self.file_path == '/':
            self.file_path = '/'
        else:
            self.file_path = self.file_path.strip('/')
            paths = self.file_path.split('/')
            if filesystem == 'default' and paths[0] == shared_with_me:
                self.special_dir = shared_with_me
                if len(paths) >= 2:
                    self.file_path = '/'.join(paths[1:])
                else:
                    self.file_path = '/'
                self.force_homedir = False

        if filesystem == 'default' and self.force_homedir:
            self.file_path = request.user.username + '/' + self.file_path
            self.file_path = self.file_path.strip('/')
        
        self.set_agave_props(request, **kwargs)

    def dispatch(self, request, *args, **kwargs):
        try:
            return super(BaseView, self).dispatch(request, *args, **kwargs)
        except (ConnectionError, HTTPError) as e:
            message = e.message
            if e.response is not None:
                try:
                    res_json = e.response.json()
                    if 'message' in res_json:
                        message = res_json['message']
                        error = e.response.status_code
                except ValueError:
                    message = e.message
                    error = 400
            else:
                message = e.message
                error = 400

            logger.error('{}'.format(message),
                exc_info = True,
                extra = {
                    'filesystem': self.filesystem,
                    'file_path': self.file_path,
                    'username': request.user.username
                }
                )
            resp = {}
            resp['error'] = error
            resp['message'] = message
            if request.FILES:
                f_name, f_val = request.FILES.iteritems().next();
                resp['file'] = f_name
            return HttpResponse(json.dumps(resp), status = 400, content_type = 'application/json')


class BasePrivateView(SecureMixin, BaseView):
    pass

class BasePublicView(BaseView):
    pass

class BasePrivateJSONView(JSONResponseMixin, BasePrivateView):
    pass

class BasePublicJSONView(JSONResponseMixin, BasePublicView):
    pass

class  BasePrivateTemplate(SecureMixin, TemplateView):
    def get_context_data(self, **kwargs):
        context = super(BasePrivateTemplate, self).get_context_data(**kwargs)
        context['unreadNotifications'] = get_number_unread_notifications(self.request)
        return context

class  BasePublicTemplate(TemplateView):
    def get_context_data(self, **kwargs):
        context = super(BasePublicTemplate, self).get_context_data(**kwargs)
        context['unreadNotifications'] = 0
        return context


class DataBrowserTestView(BasePublicTemplate):
    def dispatch(self, request, *args, **kwargs):
        try:
            return super(BasePublicTemplate, self).dispatch(request, *args, **kwargs)
        except PermissionDenied:
            path = request.get_full_path()
            resolved_login_url = resolve_url(settings.LOGIN_URL)
            from django.contrib.auth.views import redirect_to_login
            return redirect_to_login(
                path, resolved_login_url)


    def get_context_data(self, **kwargs):
        context = super(DataBrowserTestView, self).get_context_data(**kwargs)

        user_obj = self.request.user

        resource = kwargs.pop('resource', None)
        if resource is None:
            if self.request.user.is_authenticated():
                resource = 'agave'
            else:
                resource = 'public'

        file_path = kwargs.pop('file_path', None)

        # TODO get initial listing in a generic way?
        if resource == 'public':
            fm = PublicFileManager(user_obj, resource=resource, **kwargs)
        elif resource == 'box':
            fm = BoxFileManager(user_obj, **kwargs)
        elif resource == 'agave':
            fm = AgaveFileManager(user_obj, resource=resource, **kwargs)
            if file_path is not None and fm.is_shared(file_path):
                resource = '$share'
            else:
                resource = 'mydata'
        else:
            raise Http404('Unknown resource')

        listing = fm.listing(file_path)

        sourcesApi = SourcesApi()

        context['angular_init'] = json.dumps({
            'currentSource': sourcesApi.get(resource),
            'sources': sourcesApi.list(),
            'listing': listing
        })
        return context
