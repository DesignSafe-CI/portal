from django.conf.urls import patterns, url, include
from designsafe.apps.api.data.views import DataView

urlpatterns = patterns('designsafe.apps.api.data.views',
    url(r'^(?P<resource>[\w]+)/(?P<file_path>[ \S]+)?$', DataView.as_view(), name='listing'),
    url(r'^file/(?P<resource>[\w]+)/(?P<file_path>[ \S]+)?$', DataView.as_view(), name='file'),
    url(r'^search/$', DataView.as_view(), name='search'),
)
