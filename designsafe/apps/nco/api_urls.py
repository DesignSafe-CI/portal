from django.urls import re_path as url
from designsafe.apps.nco.views import (
    ProjectsListView,
    SchedEventsView,
    FiltersListView,
    SchedFacilitiesView,
    TtcGrantsView,
    TtcFacilitiesView,
    TtcGrantTypesView,
    TtcHazardTypesView,
)

"""
REST API URLS.
"""

urlpatterns = [
    url(r'projects', ProjectsListView.as_view(), name='projects_list'),
    url(r'sched_events', SchedEventsView.as_view(), name='sched_events_list'),
    url(r'filters', FiltersListView.as_view(), name='filters_list'),
    url(r'sched_facilities', SchedFacilitiesView.as_view(), name='sched_facilities_list'),
    url(r'ttc_grants', TtcGrantsView.as_view(), name='ttc_grants_list'),
    url(r'ttc_facilities', TtcFacilitiesView.as_view(), name='ttc_facilities_list'),
    url(r'ttc_grant_types', TtcGrantTypesView.as_view(), name='ttc_grant_types_list'),
    url(r'ttc_hazard_types', TtcHazardTypesView.as_view(), name='ttc_hazard_types_list'),
]
