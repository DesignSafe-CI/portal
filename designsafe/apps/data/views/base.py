import json
import logging

from designsafe.apps.api.data import lookup_file_manager
from designsafe.apps.api.data.sources import SourcesApi
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
from designsafe.apps.api.agave.filemanager.public_search_index import (
    Publication,
    LegacyPublication
)

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
        logger.info('Get context Data')
        
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
        logger.info('Get context Data')

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


class DataDepotPublishedView(TemplateView):
    """Data Depot view for published projects.

    This view will be used when a user goes directly to a published project.
    """
    template_name = 'data/data_depot.html'

    def get_context_data(self, **kwargs):
        """Update context data to add publication."""
        context = super(DataDepotPublishedView, self).get_context_data(**kwargs)
        logger.info('Get context Data')
        pub = Publication(project_id=kwargs['project_id'].strip('/'))
        logger.debug('pub: %s', pub.to_dict())
        context['citation_title'] = pub.project.value.title
        context['citation_date'] = pub.created
        context['doi'] = pub.project.doi
        context['keywords'] = pub.project.value.keywords.split(',')
        context['authors'] = [{
            'full_name': '{last_name}, {first_name}'.format(
                last_name=user['last_name'], first_name=user['first_name']
            ),
            'institution': getattr(getattr(user, 'profile'), 'institution', '')
        } for user in pub.users]
        context['publication'] = pub
        
        if self.request.user.is_authenticated:
            context['angular_init'] = json.dumps({
                'authenticated': True,
            })
        else:
            context['angular_init'] = json.dumps({
                'authenticated': False,
            })
        return context


class DataDepotLegacyPublishedView(TemplateView):
    """Data Depot view for published projects.

    This view will be used when a user goes directly to a legacy published project.
    """
    template_name = 'data/data_depot.html'

    def get_context_data(self, **kwargs):
        """Update context data to add publication."""
        context = super(DataDepotLegacyPublishedView, self).get_context_data(**kwargs)
        logger.info('Get context Data')
        nees_id = kwargs['project_id'].strip('.groups').strip('/')
        logger.debug('nees_id: %s', nees_id)
        pub = LegacyPublication(nees_id=nees_id)
        context['citation_title'] = pub.title
        context['citation_date'] = getattr(pub, 'startDate', '')
        experiments = getattr(pub, 'experiments')
        if experiments and len(experiments):
            context['doi'] = getattr(pub.experiments[0], 'doi', '')
            exp_users = [getattr(exp, 'creators', []) for exp in experiments]
            users  = [user for users in exp_users for user in users]
            context['authors'] = [{
                'full_name': '{last_name}, {first_name}'.format(
                    last_name=getattr(user, 'lastName', ''),
                    first_name=getattr(user, 'firstName', ''),
                ),
                'institution': ''
            } for user in users]
        context['publication'] = pub
        
        if self.request.user.is_authenticated:
            context['angular_init'] = json.dumps({
                'authenticated': True,
            })
        else:
            context['angular_init'] = json.dumps({
                'authenticated': False,
            })
        return context
