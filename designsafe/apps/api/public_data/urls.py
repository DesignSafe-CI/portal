from django.conf.urls import url
from designsafe.apps.api.public_data.views import (PublicDataListView,
                                                   PublicMediaView)

urlpatterns = [
    # Browsing:
    #
    # GET /listing/<file_mgr_name>/<system_id>/<file_path>
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/?$',
        PublicDataListView.as_view(),
        name='public_data_listing'),
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/(?P<file_path>[\S ]+)$',
        PublicDataListView.as_view(),
        name='public_data_listing'),
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.-]+)/$',
        PublicDataListView.as_view(),
        name='public_data_listing'),
]
