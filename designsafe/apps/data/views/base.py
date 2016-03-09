from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from .mixins import SecureMixin, AgaveMixin, JSONResponseMixin
from django.views.generic.base import View, TemplateView
from django.http import HttpResponse
from requests.exceptions import ConnectionError, HTTPError
from dsapi.agave.daos import shared_with_me
from django.conf import settings
import logging
import json

from designsafe.apps.notifications.views import get_number_unread_notifications

logger = logging.getLogger(__name__)

# Create your views here.
class BaseView(AgaveMixin, View):
    filesystem = None
    def __init__(self, **kwargs):
        self.filesystem = None
        self.file_path = None
        self.force_homedir = True
        self.special_dir = None
        self.is_public = False
        super(BaseView, self).__init__(**kwargs)

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
                except ValueError:
                    message = e.message
            logger.error('{}'.format(message),
                exc_info = True,
                extra = {
                    'filesystem': self.filesystem,
                    'file_path': self.file_path,
                    'username': request.user.username
                }
                )
            resp = {}
            resp['error'] = e.response.status_code
            resp['message'] = message
            if request.FILES:
                f_name, f_val = request.FILES.iteritems().next();
                resp['file'] = f_name
            return HttpResponse(json.dumps(resp), status = 400, content_type = 'application/json')

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

        super(BaseView, self).set_context_props(request, **kwargs)

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
