from django.conf.urls import patterns, url, include
from designsafe.apps.api.views import LoggerApi

urlpatterns = patterns(
    'designsafe.apps.api.views',
    url(r'^data/', include('designsafe.apps.api.data.urls')),
    url(r'^logger/$', LoggerApi.as_view(), name='logger'),
    url(r'^notifications/%', include('designsafe.apps.api.notifications.urls')),
    url(r'^users/', include('designsafe.apps.api.users.urls')),
)
