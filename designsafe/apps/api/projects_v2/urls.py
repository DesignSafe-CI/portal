"""Placeholder API routes"""
from django.urls import path
from designsafe.apps.api.projects_v2.views import ProjectsView

urlpatterns = [
    path("", ProjectsView.as_view()),
    # path("<string:project_id>", ProjectsView.as_view),
    # path("<string:project_id>/associations", ProjectsView.as_view),
    # path("<string:project_id>/entities/<string:entity_uuid>", ProjectsView.as_view()),
    # path("<string:project_id>/entities/<string:entity_uuid>/ordering", ProjectsView.as_view()),
    # path("<string:project_id>/entities/<string:entity_uuid>/files", ProjectsView.as_view()),
    # path("<string:project_id>/entities/<string:entity_uuid>/file-tags", ProjectsView.as_view())
]
