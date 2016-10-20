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
urlpatterns = patterns(
    'designsafe.apps.api.projects.views',
    url(r'^$', views.IndexView.as_view(), name='index'),

    url(r'^(?P<project_id>[a-z0-9\-]+)/$', views.InstanceView.as_view(), name='project'),

)
