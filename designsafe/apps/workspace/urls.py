"""Workspace URLs
"""
from django.urls import re_path
from designsafe.apps.workspace import views

urlpatterns = [
    re_path('history', views.WorkspaceView.as_view(), name="history"),
    re_path('^', views.WorkspaceView.as_view(), name="workspace"),
]
