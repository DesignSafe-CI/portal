# pylint: disable=missing-docstring
from django.conf.urls import url, include
from designsafe.apps.api.views import LoggerApi
from django.http import JsonResponse

urlpatterns = [
    url(r'^restheart/', include('designsafe.apps.api.restheart.urls')),
    url(r'^projects/', include('designsafe.apps.api.projects.urls',
                               namespace='ds_projects_api')),

    url(r'^datafiles/', include('designsafe.apps.api.datafiles.urls')),
    url(r'^publications/', include('designsafe.apps.api.publications.urls')),

    url(r'^logger/$', LoggerApi.as_view(), name='logger'),
    url(r'^notifications/', include('designsafe.apps.api.notifications.urls')),
    url(r'^users/', include('designsafe.apps.api.users.urls')),
    url(r'^search/', include('designsafe.apps.api.search.urls', namespace="ds_search_api")),

]
