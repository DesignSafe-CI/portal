"""Workspace URLs
"""
from django.urls import path
from designsafe.apps.workspace import views

urlpatterns = [
    path('', views.WorkspaceView.as_view(), name="workspace"),
]
