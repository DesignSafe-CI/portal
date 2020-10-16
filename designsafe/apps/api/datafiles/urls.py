from django.conf.urls import url
from designsafe.apps.api.datafiles.views import DataFilesView, TransferFilesView
from django.http import JsonResponse

urlpatterns = [
    url(r'^transfer/(?P<format>[\w.-]+)/$', TransferFilesView.as_view(), name='file_transfer'),
    # Browsing:
    #
    #     GET     /listing/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^(?P<api>[\w.-]+)/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/(?P<path>[ \S]+)/$',
        DataFilesView.as_view(), name='agave_files'),
    url(r'^(?P<api>[\w.-]+)/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/$',
        DataFilesView.as_view(), name='agave_files'),
]
