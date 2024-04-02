from designsafe.apps.api.views import BaseApiView
from django.http import JsonResponse, HttpResponseForbidden
from designsafe.apps.api.agave import get_service_account_client
from django.conf import settings
from requests.exceptions import HTTPError
from designsafe.apps.api.publications import operations
from designsafe.apps.projects.managers import datacite as DataciteManager
import json
import logging

# Create your views here.

logger = logging.getLogger(__name__)

"""
View for listing publications.
"""


class PublicationListingView(BaseApiView):
    def get(self, request, operation):
        client = get_service_account_client()
        try:
            listing_fn = getattr(operations, operation)
            response = listing_fn(**request.GET.dict())
            return JsonResponse(response)
        except HTTPError as e:
            return JsonResponse({"message": str(e)}, status=e.response.status_code)


"""
View for getting details (description, full definition) from a specific publication.
"""


class PublicationDetailView(BaseApiView):
    def get(self, request, operation, project_id, revision=None):
        client = get_service_account_client()
        try:
            _operation = getattr(operations, operation)
            response = _operation(project_id, revision, **request.GET.dict())
            return JsonResponse(response)
        except HTTPError as e:
            return JsonResponse({"message": str(e)}, status=e.response.status_code)


"""
View for getting DataCite DOI details from publications.
"""


class PublicationDataCiteView(BaseApiView):
    def get(self, request, doi):
        try:
            response = DataciteManager.get_doi(doi)
            return JsonResponse(response)
        except HTTPError as e:
            return JsonResponse({"message": str(e)}, status=e.response.status_code)
