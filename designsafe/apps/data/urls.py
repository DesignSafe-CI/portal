from django.conf.urls import include, url, patterns
from django.views.generic.base import TemplateView
from designsafe.apps.data.views.api import *
urlpatterns = patterns('designsafe.apps.data.views.base',
    url(r'^$', TemplateView.as_view(template_name='data/index.html')),
)

urlpatterns += patterns('designsafe.apps.data.views.api',
    url(r'^api/listings/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ListingsView.as_view(), name='listings'),
    url(r'^api/download/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', DownloadView.as_view(), name='download'),
    url(r'^api/upload/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', UploadView.as_view(), name='upload'),
    url(r'^api/meta/?$', MetaSearchView.as_view(), name='meta_search'),
    url(r'^api/meta/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', MetadataView.as_view(), name='metadata'),
    url(r'^api/rename/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ManageView.as_view(), name='manage'),
    url(r'^api/move/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ManageView.as_view(), name='manage'),
    url(r'^api/copy/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ManageView.as_view(), name='manage'),
    url(r'^api/delete/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ManageView.as_view(), name='manage'),
)

