from django.conf.urls import url
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _
from designsafe.apps.workspace import views
from views import ApiService

# TODO look at linking directly into an app in the workspace

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^api/(?P<service>[a-z]+?)/$', ApiService.as_view(), name='call_api'),
    url(r'^notification/process/(?P<pk>\d+)', views.process_notification, name='process_notification'),
]

def menu_items(**kwargs):
    if 'type' in kwargs and kwargs['type'] == 'research_workbench':
        return [
            {
                'label': _('Workspace'),
                'url': reverse('designsafe_workspace:index'),
                'children': []
            }
        ]
