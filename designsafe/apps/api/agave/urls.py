from django.conf.urls import url
from designsafe.apps.api.agave.views import (FilePermissionsView,
                                             FileMetaView,
                                             SystemsView)
                                             
                                             

urlpatterns = [

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
