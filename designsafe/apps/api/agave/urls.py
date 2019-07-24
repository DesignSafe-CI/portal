from django.conf.urls import url
from designsafe.apps.api.agave.views import (FileManagersView,
                                             FileListingView,
                                             FileMediaView,
                                             FilePermissionsView,
                                             FileMetaView,
                                             SystemsView)

urlpatterns = [

    # Sources/file managers:
    #
    #     GET     /file-managers/
    #     GET     /file-managers/<file_mgr_name>/
    url(r'^file-managers/$', FileManagersView.as_view(), name='file_managers'),
    url(r'^file-managers/(?P<file_mgr_name>[\w.-]+)/$', FileManagersView.as_view(),
        name='file_managers'),

    # Browsing:
    #
    #     GET     /listing/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/?$', FileListingView.as_view(),
        name='files_listing'),
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/(?P<file_path>[ \S]+)$',
        FileListingView.as_view(), name='files_listing'),
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/$',
        FileListingView.as_view(), name='files_listing'),

    # Search operations:
    #
    #     GET     /search/<file_mgr_name>/
    #     POST    /search/<file_mgr_name>/
    url(r'^files/search/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/?$',
        FileListingView.as_view(), name='files_search'),

    # File operations:
    #
    #     GET     /media/<file_mgr_name>/<system_id>/<file_path>/
    #     POST    /media/<file_mgr_name>/<system_id>/<file_path>/
    #     PUT     /media/<file_mgr_name>/<system_id>/<file_path>/
    #     DELETE  /media/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^files/media/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/(?P<file_path>[ \S]+)$',
        FileMediaView.as_view(), name='files_media'),

    # File metadata operations:
    #
    #     GET     /media/<file_mgr_name>/<system_id>/<file_path>/
    #     PUT     /media/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^files/meta/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/(?P<file_path>[ \S]+)$',
        FileMetaView.as_view(), name='files_metadata'),

    # Permission operations:
    #
    #     GET     /pems/<file_mgr_name>/<system_id>/<file_path>/
    #     POST    /pems/<file_mgr_name>/<system_id>/<file_path>/
    #     DELETE  /pems/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^files/pems/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/(?P<file_path>[ \S]+)$',
        FilePermissionsView.as_view(), name='files_pems'),


    # Systems
    url(r'^systems/$', SystemsView.as_view(), name='systems'),
    url(r'^systems/(?P<system_id>[\w.-]+)/$', SystemsView.as_view(), name='systems'),
]
