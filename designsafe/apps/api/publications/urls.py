from django.conf.urls import url
from designsafe.apps.api.publications.views import PublicationListingView, PublicationDetailView
from django.http import JsonResponse

urlpatterns = [


    # Browsing:
    #
    #     GET     /listing/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^(?P<operation>[\w.-]+)/$',
        PublicationListingView.as_view(), name='publication_listing'),
    url(r'^(?P<operation>[\w.-]+)/(?P<project_id>[\w.\-]+)/$', PublicationDetailView.as_view(), name='publication_detail')
]
