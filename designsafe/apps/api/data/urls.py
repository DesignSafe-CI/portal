from django.conf.urls import patterns, url, include
from designsafe.apps.api.data.views import DataView

"""
The basic url architecture when calling a Data Api should be:
api/data/<operation>/<resource>/<filepath>

operation: Can be any of these:
            - listing [GET]. Should return an array of file-like objects.
            - search [GET]. Should return an array of file-like objects.
            - download [GET]. Should return a direct url to download the folder/file 
            - file [POST | PUT | DELETE]. To update or create file/folder. 
                                 More specific action should live in the body.

"""
urlpatterns = patterns('designsafe.apps.api.data.views',
    url(r'^(?P<operation>[\w]+)/(?P<resource>[\w]+)/(?P<file_path>[ \S]+)?$', 
            DataView.as_view(), name='listing'),
    url(r'^search/$', DataSearchView.as_view(), name='search'),
)
