from django.conf.urls import url
from designsafe.apps.nco.views import ProjectsListView, FiltersListView

"""
REST API URLS.
"""

urlpatterns = [
    url(r'projects', ProjectsListView.as_view(), name='projects_list'),
    url(r'filters', FiltersListView.as_view(), name='filters_list')
]
