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
from django.conf.urls import patterns, url, include
from designsafe.apps.api.projects.views import (ProjectCollectionView,
                                                ProjectDataView,
                                                ProjectCollaboratorsView,
                                                ProjectInstanceView)

urlpatterns = [
    url(r'^$', ProjectCollectionView.as_view(), name='index'),
    url(r'^(?P<project_id>[a-z0-9\-]+)/$', ProjectInstanceView.as_view(), name='project'),
    url(r'^(?P<project_id>[a-z0-9\-]+)/collaborators/$',
        ProjectCollaboratorsView.as_view(), name='project_collaborators'),
    url(r'^(?P<project_id>[a-z0-9\-]+)/data/$',
        ProjectDataView.as_view(), name='project_data'),
    url(r'^(?P<project_id>[a-z0-9\-]+)/data/(?P<file_path>.*)/$',
        ProjectDataView.as_view(), name='project_data'),
]
