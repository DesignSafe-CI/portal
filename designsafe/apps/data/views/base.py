import json
import logging

from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.core.urlresolvers import reverse
from django.http import Http404, HttpResponse
from django.shortcuts import resolve_url
from django.utils.decorators import method_decorator
from django.views.generic.base import View, TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie
from requests.exceptions import ConnectionError, HTTPError

from designsafe.apps.api.data import lookup_file_manager
from designsafe.apps.api.data.sources import SourcesApi
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.notifications.views import get_number_unread_notifications
from dsapi.agave.daos import shared_with_me
from .mixins import SecureMixin, JSONResponseMixin

logger = logging.getLogger(__name__)


class BaseView(View):

    filesystem = None

    def __init__(self, **kwargs):
        self.agave_client = None
        self.filesystem = None
        self.file_path = None
        self.force_homedir = True
        self.special_dir = None
        self.is_public = False
        super(BaseView, self).__init__(**kwargs)

    def set_agave_props(self, request, **kwargs):
        if request.user.is_authenticated():
            self.agave_client = request.user.agave_oauth.client
        else:
            self.agave_client = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                                      token=settings.AGAVE_SUPER_TOKEN)

    def set_context_props(self, request, **kwargs):
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
                })
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

    def login_rediect(self, request):
        path = request.get_full_path()
        resolved_login_url = resolve_url(settings.LOGIN_URL)
        from django.contrib.auth.views import redirect_to_login
        return redirect_to_login(
            path, resolved_login_url)

    @method_decorator(ensure_csrf_cookie)
    def dispatch(self, request, *args, **kwargs):
        try:
            return super(BasePublicTemplate, self).dispatch(request, *args, **kwargs)
        except PermissionDenied:
            return self.login_rediect(request)

    def get_context_data(self, **kwargs):
        context = super(DataBrowserTestView, self).get_context_data(**kwargs)

        resource = kwargs.pop('resource', None)
        if resource is None:
            if self.request.user.is_authenticated():
                resource = 'agave'
            else:
                resource = 'public'

        fm_cls = lookup_file_manager(resource)
        if fm_cls is None:
            raise Http404('Unknown resource')

        file_path = kwargs.pop('file_path', None)
        try:
            fm = fm_cls(self.request.user)
            if not fm.is_search(file_path):
                listing = fm.listing(file_path)
            else:
                d = {}
                d.update(kwargs)
                d.update(self.request.GET.dict())
                listing = fm.search(**d)
                   
        except ApiException as e:
            fm = None
            action_url = e.extra.get('action_url', None)
            action_label = e.extra.get('action_label', None)
            if action_url is None and e.response.status_code == 403:
                action_url = '{}?next={}'.format(reverse('login'), self.request.path)
                action_label = 'Log in'
            listing = {
                'source': resource,
                'id': file_path,
                '_error': {
                    'status': e.response.status_code,
                    'message': e.response.reason,
                    'action_url': action_url,
                    'action_label': action_label
                },
            }

        sources_api = SourcesApi()
        source_id = resource
        if source_id == 'agave':
            if fm is not None and fm.is_shared(file_path):
                source_id = '$share'
            else:
                source_id = 'mydata'
        current_source = sources_api.get(source_id)
        sources_list = sources_api.list()
        context['angular_init'] = json.dumps({
            'currentSource': current_source,
            'sources': sources_list,
            'listing': listing,
            'state': {
                'search': fm.is_search(file_path) if fm is not None else False
            }
        })
        return context
