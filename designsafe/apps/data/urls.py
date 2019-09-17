"""Data urls."""

from django.urls import re_path
from designsafe.apps.data.views.base import (
    DataDepotView,
    FileMediaView,
    DataDepotPublishedView,
    DataDepotLegacyPublishedView
)

urlpatterns = [
    re_path(
        r'^browser/public/designsafe.storage.published/(?P<project_id>[\w.\-\/]+)/(?P<file_path>[ \S]+)/?',
        DataDepotPublishedView.as_view()
    ),
    re_path(
        r'^browser/public/designsafe.storage.published/(?P<project_id>[\w.\-\/]+)/?',
        DataDepotPublishedView.as_view()
    ),
    re_path(
        r'^browser/public/nees.public/(?P<project_id>[\w.\-\/]+)/(?P<file_path>[ \S]+)/?',
        DataDepotLegacyPublishedView.as_view()
    ),
    re_path(
        r'^browser/public/nees.public/(?P<project_id>[\w.\-\/]+)/?',
        DataDepotLegacyPublishedView.as_view()
    ),
    re_path(
        r'^browser/',
        DataDepotView.as_view(template_name='data/data_depot.html'),
        name='data_depot'
    ),
    re_path(
        r'^browser/files/media/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.\-]+)/(?P<file_path>[ \S]+)$',
        FileMediaView.as_view(),
        name='files_media'
    ),
]
