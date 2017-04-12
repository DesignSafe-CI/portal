from django.conf.urls import url
from designsafe.apps.api.public_data.views import (PublicDataListView,
                                                   PublicMediaView,
                                                   PublicSearchView,
                                                   PublicPemsView)
from designsafe.apps.api.agave.views import (FileMediaView,
                                             FilePermissionsView,
                                             SystemsView)

urlpatterns = [
    # Browsing:
    #
    # GET /listing/<file_mgr_name>/<system_id>/<file_path>
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/?$',
        PublicDataListView.as_view(),
        name='public_data_listing'),
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/(?P<file_path>[\S ]+)/?$',
        PublicDataListView.as_view(),
        name='public_data_listing'),
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/$',
        PublicDataListView.as_view(),
        name='public_data_listing'),

    # Search operations:
    #
    #     GET     /search/<file_mgr_name>/
    #     POST    /search/<file_mgr_name>/
    url(r'^files/search/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/?$',
        PublicSearchView.as_view(), name='public_files_search'),

    # File operations:
    #
    #     GET     /media/<file_mgr_name>/<system_id>/<file_path>/
    #     POST    /media/<file_mgr_name>/<system_id>/<file_path>/
    #     PUT     /media/<file_mgr_name>/<system_id>/<file_path>/
    #     DELETE  /media/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^files/media/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/(?P<file_path>[ \S]+)$',
        PublicMediaView.as_view(), name='public_files_media'),


    # Permission operations:
    #
    #     GET     /pems/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^files/pems/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/(?P<file_path>[ \S]+)$',
        PublicPemsView.as_view(), name='public_files_pems'),


    # Systems
    url(r'^systems/$', SystemsView.as_view(), name='systems'),
    url(r'^systems/(?P<system_id>[\w.-]+)/$', SystemsView.as_view(), name='systems'),
]
