"""Workpace API Urls
"""

from django.urls import path, re_path
from designsafe.apps.workspace.api import views


app_name = "workspace_api"
urlpatterns = [
    path("apps/", views.AppsView.as_view()),
    path("tray/", views.AppsTrayView.as_view()),
    path("description", views.AppDescriptionView.as_view()),
    re_path(
        r"^jobs/(?P<job_uuid>[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}\-[0-9a-fA-F]{3})/history/?$",
        views.JobHistoryView.as_view(),
    ),
    re_path(r"^jobs/(?P<operation>\w+)/?$", views.JobsView.as_view()),
    path("jobs", views.JobsView.as_view()),
]
