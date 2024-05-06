"""Publication API routes"""

from django.urls import path, re_path
from designsafe.apps.api.publications_v2.views import (
    PublicationListingView,
    PublicationDetailView,
)

urlpatterns = [
    path("", PublicationListingView.as_view()),
    path("/", PublicationListingView.as_view()),
    re_path(r'^(?P<project_id>[A-Z\-]+-[0-9]+)(v(?P<version>[0-9]+))?/?$', PublicationDetailView.as_view()),
    #path("<str:project_id>", PublicationDetailView.as_view()),
    #path("<str:project_id>/", PublicationDetailView.as_view()),
]
