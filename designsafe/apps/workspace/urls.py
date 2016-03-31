from django.conf.urls import url, patterns
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _

# TODO look at linking directly into an app in the workspace

urlpatterns = patterns(
    'designsafe.apps.workspace.views',
    url(r'^$', 'index', name='index'),
    url(r'^api/(?P<service>[a-z]+?)/$', 'call_api', name='call_api'),
    url(r'^interactive2/(?P<hostname>.+)/(?P<port>[0-9]+?)/(?P<password>.+)//$', 'interactive2', name='interactive2'),
)

def menu_items(**kwargs):
    if 'type' in kwargs and kwargs['type'] == 'research_workbench':
        return [
            {
                'label': _('Workspace'),
                'url': reverse('designsafe_workspace:index'),
                'children': []
            }
        ]
