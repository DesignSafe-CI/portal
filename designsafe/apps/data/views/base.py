import json
import logging

from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.notifications.views import get_number_unread_notifications
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.core.urlresolvers import reverse
from django.http import Http404, HttpResponse
from django.shortcuts import resolve_url
from django.utils.decorators import method_decorator
from django.views.generic.base import TemplateView, View
from django.views.decorators.csrf import ensure_csrf_cookie
from designsafe.libs.common.decorators import profile

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

    @profile
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

class FileMediaView(View):
    systems_mappings = {
        'designsafe.storage.default': 'shared',
        'designsafe.storage.published': 'published',
        'designsafe.storage.community': 'community',
        'nees.public': 'public/projects'
    }
    corral = '/corral-repl/tacc/NHERI/'

    def get_system_dirname(self, system_id):
        dirname = self.systems_mappings.get(system_id)
        if dirname is None and system_id.startswith('project-'):
            prjuuid = system_id.replace('project-', '')
            dirname = 'projects/{prjuuid}'.format(prjuuid=prjuuid)

        return dirname

    def get(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name not in ['public', 'community'] and \
            not request.user.is_authenticated:
            raise Http404('Resource not Found')
        
        filename = file_path.rsplit('/', 1)[1]
        filepath = '{corral}/{sys_dirname}/{file_path}'.format(
            corral=self.corral, sys_dirname=self.get_system_dirname(system_id),
            file_path=file_path)
        response = HttpResponse()
        response['Content-Disposition'] = 'attachment; filename={filename}'.format(filename=filename)
        response['X-Accel-Redirect'] = '/internal-resource/{filepath}'.format(filepath=filepath)
        return response
