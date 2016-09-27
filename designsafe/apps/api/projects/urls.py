from django.conf.urls import patterns, url, include
from designsafe.apps.api.projects import views

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
    url(r'^$', views.ProjectCollectionView.as_view(), name='index'),
    url(r'^(?P<project_id>[a-z0-9\-]+)/$', views.ProjectInstanceView.as_view(), name='project'),
    url(r'^(?P<project_id>[a-z0-9\-]+)/data/$', views.ProjectDataView.as_view(), name='project_data'),
    url(r'^(?P<project_id>[a-z0-9\-]+)/data/(?P<file_path>.*)/$', views.ProjectDataView.as_view(), name='project_data'),
]
