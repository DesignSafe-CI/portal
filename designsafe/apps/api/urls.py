"""Designsafe REST API urls."""
from django.urls import path, include
from designsafe.apps.api.views import LoggerApi

app_name = "ds_res_api"
urlpatterns = [
    path('logger/', LoggerApi.as_view(), name='logger'),
    path('agave/', include('designsafe.apps.api.agave.urls',
                           namespace="ds_agave_api")),
    path('public/', include('designsafe.apps.api.agave.urls',
                            namespace="ds_public_api")),
    path('projects/', include('designsafe.apps.api.projects.urls',
                              namespace='ds_projects_api')),
    path('external-resources/', include('designsafe.apps.api.external_resources.urls',
                                        namespace="ds_external_resources_api")),
    path('notifications/', include('designsafe.apps.api.notifications.urls',
                                   namespace="ds_notifications_api")),
    path('users/', include('designsafe.apps.api.users.urls',
                           namespace="ds_users_api")),
    path('search/', include('designsafe.apps.api.search.urls', namespace="ds_search_api")),

]
