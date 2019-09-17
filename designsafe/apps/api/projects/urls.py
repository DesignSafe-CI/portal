"""Api projects urls."""
from django.urls import path, re_path
from designsafe.apps.api.projects.views import (ProjectListingView,
                                                ProjectCollectionView,
                                                ProjectDataView,
                                                ProjectCollaboratorsView,
                                                ProjectInstanceView,
                                                ProjectMetaView,
                                                PublicationView,
                                                NeesPublicationView)

urlpatterns = [
    re_path(r'^publication/((?P<project_id>[a-zA-Z0-9\-\_\.]+)/?)?', PublicationView.as_view(), name='publication'),

    re_path(r'^nees-publication/((?P<nees_id>[a-zA-Z0-9\-\_\.]+)/?)?', NeesPublicationView.as_view(), name='nees-publication'),

    re_path(r'^listing/(?P<username>[a-zA-Z0-9\-_\.]+)/?$', ProjectListingView.as_view(), name='listing'),


    re_path(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.]+)/(?P<project_id>[a-z0-9-]+)/$',
            ProjectDataView.as_view(),
            name='projects_data_listing'),
    re_path(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<project_system_id>[\w-]+)/(?P<file_path>[ \S]*)$',
            ProjectDataView.as_view(),
            name='projects_data_listing'),
    re_path(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.]+)/Projects$',
            ProjectCollectionView.as_view(),
            name='projects_listing'),
    re_path(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.]+)/$',
            ProjectCollectionView.as_view(),
            name='projects_listing'),

    re_path(r'^meta/(?P<uuid>[^ \/]+)/?$',
            ProjectMetaView.as_view(), name='project_meta'),

    re_path(r'^(?P<project_id>[a-z0-9\-]+)/meta/(?P<name>[a-zA-Z0-9\.\-_]+)/?$',
            ProjectMetaView.as_view(), name='project_meta'),

    re_path(r'^(?P<project_id>[a-z0-9\-]+)/$',
            ProjectInstanceView.as_view(), name='project'),

    re_path(r'^(?P<project_id>[a-z0-9\-]+)/collaborators/$',
            ProjectCollaboratorsView.as_view(), name='project_collaborators'),

    re_path(r'^(?P<project_id>[a-z0-9\-]+)/data/$',
            ProjectDataView.as_view(), name='project_data'),

    re_path(r'^(?P<project_id>[a-z0-9\-]+)/data/(?P<file_path>.*)/$',
            ProjectDataView.as_view(), name='project_data'),

    path('', ProjectCollectionView.as_view(), name='index'),
]
