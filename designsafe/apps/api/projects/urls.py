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
from django.conf.urls import url, include
from designsafe.apps.api.projects.views import (ProjectListingView,
                                                ProjectCollectionView,
                                                ProjectDataView,
                                                ProjectInstanceView,
                                                ProjectMetaView,
                                                ProjectNotificationView,
                                                PublicationView,
                                                AmendPublicationView,
                                                NeesPublicationView)

urlpatterns = [
    url(r'^publication/(?P<project_id>[A-Z\-]+-[0-9]+)?(v(?P<revision>[0-9]+))?/?', PublicationView.as_view(), name='publication'),

    url(r'^amend-publication/((?P<project_id>[a-zA-Z0-9\-\_\.]+)/?)?', AmendPublicationView.as_view(), name='amend-publication'),

    url(r'^nees-publication/((?P<nees_id>[a-zA-Z0-9\-\_\.]+)/?)?', NeesPublicationView.as_view(), name='nees-publication'),

    url(r'^listing/(?P<username>[a-zA-Z0-9\-_\.]+)/?$', ProjectListingView.as_view(), name='listing'),


    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.]+)/(?P<project_id>[a-z0-9-]+)/$',
        ProjectDataView.as_view(),
        name='projects_data_listing'),
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<project_system_id>[\w-]+)/(?P<file_path>[ \S]*)$',
        ProjectDataView.as_view(),
        name='projects_data_listing'),
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.]+)/Projects$',
        ProjectCollectionView.as_view(),
        name='projects_listing'),
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.]+)/$',
        ProjectCollectionView.as_view(),
        name='projects_listing'),

    url(r'^meta/(?P<uuid>[^ \/]+)/?$',
        ProjectMetaView.as_view(), name='project_meta'),

    url(r'^(?P<project_id>[a-z0-9\-]+)/meta/(?P<name>[a-zA-Z0-9\.\-_]+)/?$',
        ProjectMetaView.as_view(), name='project_meta'),

    url(r'^(?P<project_id>[a-z0-9\-]+)/$',
        ProjectInstanceView.as_view(), name='project'),

    url(r'^(?P<project_id>[a-z0-9\-]+)/data/$',
        ProjectDataView.as_view(), name='project_data'),

    url(r'^(?P<project_id>[a-z0-9\-]+)/data/(?P<file_path>.*)/$',
        ProjectDataView.as_view(), name='project_data'),

    url(r'^(?P<project_uuid>[a-z0-9\-]+)/notification/$',
        ProjectNotificationView.as_view(), name='project_notification'),

    url(r'^/?', ProjectCollectionView.as_view(), name='index'),
]
