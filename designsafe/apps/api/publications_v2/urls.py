"""Publication API routes"""

from django.urls import path
from designsafe.apps.api.publications_v2.views import (
    PublicationListingView, PublicationDetailView
)

urlpatterns = [
    path("", PublicationListingView.as_view()),
    path("/", PublicationListingView.as_view()),

    path("<str:project_id>", PublicationDetailView.as_view()),
    path("<str:project_id>/", PublicationDetailView.as_view()),
]
