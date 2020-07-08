from django.conf.urls import url
from designsafe.apps.api.datafiles.views import AgaveFilesView, GoogledriveFilesView, TransferFilesView
from django.http import JsonResponse

urlpatterns = [


    # Browsing:
    #
    #     GET     /listing/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^agave/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/(?P<path>[ \S]+)/$',
        AgaveFilesView.as_view(), name='files_listing'),
    url(r'^agave/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/$',
        AgaveFilesView.as_view(), name='files_listing'),

    url(r'^googledrive/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/(?P<path>[\w.-]+)/$',
        GoogledriveFilesView.as_view(), name='files_listing'),
    url(r'^googledrive/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/$',
        GoogledriveFilesView.as_view(), name='files_listing'),

    url(r'^transfer/(?P<format>[\w.-]+)/$', TransferFilesView.as_view(), name='transfer_listing')

]
