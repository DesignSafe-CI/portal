from django.conf.urls import url
from designsafe.apps.api.datafiles.views import AgaveFilesView, GoogledriveFilesView, BoxFilesView, DropboxFilesView, TransferFilesView, SharedFilesView
from django.http import JsonResponse

urlpatterns = [


    # Browsing:
    #
    #     GET     /listing/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^agave/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/(?P<path>[ \S]+)/$',
        AgaveFilesView.as_view(), name='agave_files'),
    url(r'^agave/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/$',
        AgaveFilesView.as_view(), name='agave_files'),

    url(r'^shared/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/(?P<path>[ \S]+)/$',
        SharedFilesView.as_view(), name='shared_files'),
    url(r'^shared/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/$',
        SharedFilesView.as_view(), name='shared_files'),

    url(r'^googledrive/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/(?P<path>[\w.-]+)/$',
        GoogledriveFilesView.as_view(), name='googledrive_files'),
    url(r'^googledrive/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/$',
        GoogledriveFilesView.as_view(), name='googledrive_files'),

    url(r'^dropbox/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/(?P<path>[ \S]+)/$',
        DropboxFilesView.as_view(), name='dropbox_files'),
    url(r'^dropbox/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-:]+)/$',
        DropboxFilesView.as_view(), name='dropbox_files'),


    url(r'^box/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/(?P<path>[ \S]+)/$',
        BoxFilesView.as_view(), name='box_files'),
    url(r'^box/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/$',
        BoxFilesView.as_view(), name='box_files'),


    url(r'^transfer/(?P<format>[\w.-]+)/$', TransferFilesView.as_view(), name='file_transfer'),
]
