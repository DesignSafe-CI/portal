"""Placeholder API routes"""

from django.urls import path
from designsafe.apps.api.projects_v2.views import (
    ProjectsView,
    ProjectInstanceView,
    ProjectEntityView,
    ProjectEntityOrderView,
    ProjectEntityValidateView,
    ProjectEntityAssociationsView,
    ProjectFileAssociationsView,
    ProjectFileTagsView,
    ProjectPreviewView,
)

urlpatterns = [
    path("", ProjectsView.as_view()),
    path("/", ProjectsView.as_view()),
    path("<str:project_id>", ProjectInstanceView.as_view()),
    path("<str:project_id>/", ProjectInstanceView.as_view()),
    path("<str:project_id>/preview", ProjectPreviewView.as_view()),
    path("<str:project_id>/preview/", ProjectPreviewView.as_view()),
    # path("<string:project_id>/associations", ProjectsView.as_view),
    path("entities/<str:entity_uuid>/", ProjectEntityView.as_view()),
    path("<str:project_id>/entities/ordering/", ProjectEntityOrderView.as_view()),
    path("<str:project_id>/entities/validate/", ProjectEntityValidateView.as_view()),
    path(
        "<str:project_id>/entities/associations/<str:node_id>/",
        ProjectEntityAssociationsView.as_view(),
    ),
    path(
        "<str:project_id>/entities/<str:entity_uuid>/files/",
        ProjectFileAssociationsView.as_view(),
    ),
    path(
        "<str:project_id>/entities/<str:entity_uuid>/files/<path:file_path>/",
        ProjectFileAssociationsView.as_view(),
    ),
    path(
        "<str:project_id>/entities/<str:entity_uuid>/file-tags/<path:file_path>/",
        ProjectFileTagsView.as_view(),
    ),
]
