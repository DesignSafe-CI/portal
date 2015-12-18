from django.conf.urls import include, url, patterns
from django.views.generic.base import TemplateView

urlpatterns = patterns('designsafe.apps.data.views.base',
    url(r'^$', TemplateView.as_view(template_name='data/index.html')),
    url(r'^template/(?P<resource>.+?)\.html$', 'get_template', name='data-get_template'),
)

urlpatterns += patterns('designsafe.apps.data.views.api',
    url(r'^api/listings/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', 'listings', name='listings'),
    url(r'^api/download/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', 'download', name='download'),
    url(r'^api/meta/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', 'metadata', name='metadata'),
) 
