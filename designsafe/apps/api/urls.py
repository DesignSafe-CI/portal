from django.conf.urls import url, include
from designsafe.apps.api.views import LoggerApi

urlpatterns = [
    url(r'^data/', include('designsafe.apps.api.data.urls')),
    url(r'^data2/', include('designsafe.apps.api.data.urls2')),
    url(r'^logger/$', LoggerApi.as_view(), name='logger'),
    url(r'^notifications/%', include('designsafe.apps.api.notifications.urls')),
    url(r'^users/', include('designsafe.apps.api.users.urls')),
    url(r'^projects/', include('designsafe.apps.api.projects.urls',
                               namespace='ds_projects_api'))
]
