"""Api external resources urls."""
from django.conf.urls import re_path
from designsafe.apps.api.external_resources.views import (FilesListView,
                                                          FileMediaView,
                                                          FilePermissionsView)

urlpatterns = [
    # Browsing:
    #
    # GET /listing/<file_mgr_name>/<system_id>/<file_path>
    re_path(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/?$',
            FilesListView.as_view(),
            name='box_files_listing'),
    re_path(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<file_id>[ \S]+)/?$',
            FilesListView.as_view(),
            name='box_files_listing'),

    # File operations:
    #
    #     GET     /media/<file_mgr_name>/<system_id>/<file_path>/
    #     POST    /media/<file_mgr_name>/<system_id>/<file_path>/
    #     PUT     /media/<file_mgr_name>/<system_id>/<file_path>/
    #     DELETE  /media/<file_mgr_name>/<system_id>/<file_path>/
    re_path(r'^files/media/(?P<file_mgr_name>[\w.-]+)/(?P<file_id>[ \S]+)$',
            FileMediaView.as_view(), name='box_files_media'),

    # Permission operations:
    #
    #     GET     /pems/<file_mgr_name>/<system_id>/<file_path>/
    #     POST    /pems/<file_mgr_name>/<system_id>/<file_path>/
    #     DELETE  /pems/<file_mgr_name>/<system_id>/<file_path>/
    re_path(r'^files/pems/(?P<file_mgr_name>[\w.-]+)/(?P<file_id>[ \S]+)$',
            FilePermissionsView.as_view(), name='box_files_pems'),
]
