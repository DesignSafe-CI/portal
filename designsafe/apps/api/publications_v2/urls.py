"""Publication API routes"""

from django.urls import path, re_path
from django.views.decorators.cache import cache_page
from designsafe.apps.api.publications_v2.views import (
    PublicationListingView,
    PublicationDetailView,
    PublicationPublishView,
    PublicationAmendView,
    PublicationVersionView,
    PublicationClarivateView,
)

urlpatterns = [
    path("", PublicationListingView.as_view()),
    path("/", PublicationListingView.as_view()),
    path("publish/", PublicationPublishView.as_view()),
    path("amend/", PublicationAmendView.as_view()),
    path("version/", PublicationVersionView.as_view()),
    path("clarivate/", cache_page(60 * 15)(PublicationClarivateView.as_view())),
    re_path(
        r"^(?P<project_id>[A-Z\-]+-[0-9]+)(v(?P<version>[0-9]+))?/?$",
        PublicationDetailView.as_view(),
    ),
    # path("<str:project_id>", PublicationDetailView.as_view()),
    # path("<str:project_id>/", PublicationDetailView.as_view()),
]
