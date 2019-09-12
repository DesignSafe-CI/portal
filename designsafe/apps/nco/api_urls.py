"""Nco API urls."""
from django.conf.urls import path
from designsafe.apps.nco.views import ProjectsListView, FiltersListView

urlpatterns = [
    path('projects', ProjectsListView.as_view(), name='projects_list'),
    path('filters', FiltersListView.as_view(), name='filters_list'),
]
