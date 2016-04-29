from django.conf.urls import patterns, url, include
from designsafe.apps.api.views import LoggerApi

urlpatterns = patterns(
    'designsafe.apps.api.views',
    url(r'^logger/$', LoggerApi.as_view(), name='logger'),
    url(r'^data/', include('data.urls')),
)
