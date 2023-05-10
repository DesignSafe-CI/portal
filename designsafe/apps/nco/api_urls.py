from django.conf.urls import url
from designsafe.apps.nco.views import ProjectsListView, FiltersListView, TtcGrantsView, TtcFacilitiesView

"""
REST API URLS.
"""

urlpatterns = [
    url(r'projects', ProjectsListView.as_view(), name='projects_list'),
    url(r'filters', FiltersListView.as_view(), name='filters_list'),
    url(r'ttc_grants', TtcGrantsView.as_view(), name='ttc_grants_list'),
    url(r'ttc_facilities', TtcFacilitiesView.as_view(), name='ttc_facilities_list'),
]
