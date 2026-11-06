from django.urls import re_path as url
from django.views.decorators.cache import cache_page

from designsafe.apps.api.publications.views import (
    PublicationClarivateView,
    PublicationDataCiteEventsView,
    PublicationDataCiteView,
    PublicationDetailView,
    PublicationListingView,
)

urlpatterns = [


    # Browsing:
    #
    #     GET     /listing/<file_mgr_name>/<system_id>/<file_path>/
    url(r'^data-cite/events$', cache_page(60*15)(PublicationDataCiteEventsView.as_view()), name='publication_datacite_usage'),    
    url(r'^data-cite/(?P<doi>\S+)$', cache_page(60*15)(PublicationDataCiteView.as_view()), name='publication_datacite'),
    url(r'^clarivate/$', cache_page(86400)(PublicationClarivateView.as_view()), name='publication_clarivate'),
    url(r'^(?P<operation>[\w.-]+)/$', PublicationListingView.as_view(), name='publication_listing'),
    url(r'^(?P<operation>[\w.-]+)/(?P<project_id>[A-Z\-]+-[0-9]+)(v(?P<revision>[0-9]+))?/$', PublicationDetailView.as_view(), name='publication_detail'),
    url(r'^(?P<operation>[\w.-]+)/(?P<project_id>[\w.-]+)/$', PublicationDetailView.as_view(), name='legacy-publication_detail'),
]
