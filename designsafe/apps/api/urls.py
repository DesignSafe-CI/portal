from django.conf.urls import url, include
from designsafe.apps.api.views import LoggerApi

urlpatterns = [
    url(r'^agave/', include('designsafe.apps.api.agave.urls')),
    url(r'^data/', include('designsafe.apps.api.data.urls')),
    url(r'^logger/$', LoggerApi.as_view(), name='logger'),
    url(r'^notifications/%', include('designsafe.apps.api.notifications.urls')),
    url(r'^users/', include('designsafe.apps.api.users.urls')),
    url(r'^projects/', include('designsafe.apps.api.projects.urls',
                               namespace='ds_projects_api'))
]
