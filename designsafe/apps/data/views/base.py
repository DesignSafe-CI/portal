import json
import logging

from designsafe.apps.api.data import lookup_file_manager
from designsafe.apps.api.data.sources import SourcesApi
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.notifications.views import get_number_unread_notifications
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.core.urlresolvers import reverse
from django.http import Http404
from django.shortcuts import resolve_url
from django.utils.decorators import method_decorator
from django.views.generic.base import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie

logger = logging.getLogger(__name__)




class  BasePublicTemplate(TemplateView):
    def get_context_data(self, **kwargs):
        context = super(BasePublicTemplate, self).get_context_data(**kwargs)
        context['unreadNotifications'] = 0
        return context




class DataDepotView(BasePublicTemplate):
    """
    Primary Data Depot View
    """

    @staticmethod
    def login_redirect(request):
        path = request.get_full_path()
        resolved_login_url = resolve_url(settings.LOGIN_URL)
        from django.contrib.auth.views import redirect_to_login
        return redirect_to_login(
            path, resolved_login_url)

    @method_decorator(ensure_csrf_cookie)
    def dispatch(self, request, *args, **kwargs):
        try:
            return super(DataDepotView, self).dispatch(request, *args, **kwargs)
        except PermissionDenied:
            return DataDepotView.login_redirect(request)

    def get_context_data(self, **kwargs):
        context = super(DataDepotView, self).get_context_data(**kwargs)
        
        if self.request.user.is_authenticated:
            context['angular_init'] = json.dumps({
                'authenticated': True,
            })
        else:
            context['angular_init'] = json.dumps({
                'authenticated': False,
            })

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

        context['unreadNotifications'] = get_number_unread_notifications(self.request)

        resource = kwargs.pop('resource', None)
        if resource is None:
            if self.request.user.is_authenticated:
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
