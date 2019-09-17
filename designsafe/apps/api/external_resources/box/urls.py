# pylint: disable=missing-docstring
from django.urls import url
from designsafe.apps.api.external_resources.views import FilesListView

app_name = "external_resources"
urlpatterns = [
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+/?$',
        FilesListView.as_view(),
        name='box_files_listing'),
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+/(?P<file_id>[ \S]+)/?$',
        FilesListView.as_view(),
        name='box_files_listing')
]
