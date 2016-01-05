
from django.conf.urls import include, url, patterns
from django.views.generic.base import TemplateView

urlpatterns = patterns('designsafe.apps.workspace.views',
    url(r'^$', 'index', name='index'),
    url(r'^templates/(?P<resource>.+?)\.html$', 'get_template', name='ws_get_template'),
    url(r'^apps-list/$', 'apps_list', name='data-apps_list'),
    url(r'^files-list/$', 'files_list', name='data-files_list'),
    url(r'^jobs-list/$', 'jobs_list', name='data-jobs_list'),
    url(r'^jobs-details/$', 'jobs_details', name='data-jobs_details'),
)
