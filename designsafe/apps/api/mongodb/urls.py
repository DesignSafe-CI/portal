from django.conf.urls import url
from designsafe.apps.api.mongodb.views import MongoMetaView

urlpatterns = [
    # mongodb metadata operations:
    #
    #     GET     /media/<file_path>/
    #     POST     /media/<file_path>/
    #     DEL     /media/<file_path>/
    # url(r'^files/mongometa/(?P<file_path>[ \S]+)$', MongoMetaView.as_view(), name='mongo_metadata'),
    url(r'^files/mongometa/(?P<system_id>[\w.-]+)/(?P<file_path>[ \S]+)$', MongoMetaView.as_view(), name='mongo_metadata'),
]