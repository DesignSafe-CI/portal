from django.conf.urls import url, include
from designsafe.apps.api.data.views import (SourcesView,
                                            DataView,
                                            DataSearchView,
                                            DataFileManageView,
                                            ProcessNotificationView)

"""
The basic url architecture when calling a Data Api should be:
api/data/<[listing | file | search]>/<resource>/<filepath>

operation: Can be any of these:
            - listing [GET]. Should return an array of file-like objects.
            - search [GET]. Should return an array of file-like objects.
            - download [GET]. Should return a direct url to download the folder/file
            - file [POST | PUT | DELETE]. To update or create file/folder.
                                 More specific action should live in the body.

"""
urlpatterns = [
    url(r'^sources/$', SourcesView.as_view(), name='sources'),

    url(r'^sources/(?P<source_id>[\w.-]+)/$', SourcesView.as_view(), name='sources'),

    url(r'^listing/(?P<resource>[\w.-]+)/?$', DataView.as_view(), name='list'),

    url(r'^listing/(?P<resource>[\w.-]+)/(?P<file_id>[ \S]+)$',
        DataView.as_view(), name='list'),

    url(r'^file/(?P<resource>[\w.-]+)/(?P<file_id>[ \S]+)$',
        DataFileManageView.as_view(), name='file'),

    # url(r'^download/(?P<resource>[\w.-]+)/?(?P<file_id>[ \S]+)?$',
    #     DataDownloadView.as_view(), name='download'),

    url(r'^search/(?P<resource>[\w.-]+)/?$', DataSearchView.as_view(), name='search'),

    url(r'^notification/process/(?P<pk>\d+)', ProcessNotificationView.as_view(), name='process_notification'),
]
