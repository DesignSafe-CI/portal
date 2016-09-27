from django.conf.urls import url
from designsafe.apps.api.data.views2 import (FileManagersView, FileListingView,
                                             FileSearchView, FileMediaView,
                                             FilePermissionsView)

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
    url(r'^listing/(?P<file_mgr_name>[\w.-]+)/?$', FileListingView.as_view(),
        name='files_listing'),
    url(r'^listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/(?P<file_path>[ \S]+)$',
        FileListingView.as_view(), name='files_listing'),
    url(r'^listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/$',
        FileListingView.as_view(), name='files_listing'),

    # Search operations:
    #
    #     GET     /search/<file_mgr_name>/
    #     POST    /search/<file_mgr_name>/
    url(r'^search/(?P<file_mgr_name>[\w.-]+)/$', FileSearchView.as_view(), name='files_search'),

    # File operations:
    #
    #     GET     /media/<file_mgr_name>/<system_id>/<file_path>/
    #     POST    /media/<file_mgr_name>/<system_id>/<file_path>/
    #     PUT     /media/<file_mgr_name>/<system_id>/<file_path>/
    #     DELETE  /media/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^media/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>/<file_path>[ \S]+)$',
        FileMediaView.as_view(), name='files_media'),


    # Permission operations:
    #
    #     GET     /pems/<file_mgr_name>/<system_id>/<file_path>/
    #     POST    /pems/<file_mgr_name>/<system_id>/<file_path>/
    #     DELETE  /pems/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^pems/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>/<file_path>[ \S]+)$',
        FilePermissionsView.as_view(), name='files_pems'),
]
