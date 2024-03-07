"""Workpace API Urls
"""

from django.urls import path
from designsafe.apps.workspace.api import views


app_name = "workspace_api"
urlpatterns = [
    path("apps", views.AppsView.as_view()),
    path("tray", views.AppsTrayView.as_view()),
]
