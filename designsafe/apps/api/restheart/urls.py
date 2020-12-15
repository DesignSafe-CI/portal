from django.conf.urls import url
from designsafe.apps.api.restheart.views import RestHeartFileMetaView

urlpatterns = [
    # restheart metadata operations:
    #
    #     GET     /media/<file_path>/
    #     POST    /media/<file_path>/
    #     PUT     /media/<file_path>/
    #     DEL     /media/<file_path>/
    #  remove slash between vars?
    # url(r'^files/v3/(?P<system_id>[\w.-]+)/(?P<file_path>[ \S]+)$', RestHeartFileMetaView.as_view(), name='restheart_files_meta'),
    url(r'^files/v3/(?P<system_id>[\w.-]+)(?P<file_path>[ \S]+)$', RestHeartFileMetaView.as_view(), name='restheart_files_meta'),
]