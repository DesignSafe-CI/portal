"""Workspace URLs
"""
from django.urls import re_path
from designsafe.apps.workspace import views

urlpatterns = [
    re_path('^', views.WorkspaceView.as_view(), name="workspace"),
]
