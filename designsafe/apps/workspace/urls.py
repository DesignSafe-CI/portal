
from django.conf.urls import include, url, patterns
from django.views.generic.base import TemplateView

urlpatterns = patterns('designsafe.apps.workspace.views',
    url(r'^$', 'index', name='index'),
    url(r'^api/(?P<service>[a-z]+?)/$', 'call_api', name='call_api'),
    # url(r'^apps-list/$', 'apps_list', name='apps_list'),
    # url(r'^files-list/$', 'files_list', name='files_list'),
    # url(r'^jobs-list/$', 'jobs_list', name='jobs_list'),
    # url(r'^jobs-details/$', 'jobs_details', name='jobs_details'),
)
