from designsafe.apps.api.views import BaseApiView
from django.http import JsonResponse, HttpResponseForbidden
from designsafe.apps.api.agave import get_service_account_client
from django.conf import settings
from requests.exceptions import HTTPError
from designsafe.apps.api.publications import operations
from designsafe.apps.projects.managers import datacite as DataciteManager
import json
import logging
import requests


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
            return JsonResponse({'message': str(e)}, status=e.response.status_code)

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
            return JsonResponse({'message': str(e)}, status=e.response.status_code)

"""
View for getting DataCite DOI details from publications.
"""
class PublicationDataCiteView(BaseApiView):
    def get(self, request, doi):
        url = f'https://api.datacite.org/dois/{doi}' 

        try:
            response = requests.get(url)
            response.raise_for_status()  # Raises an HTTPError for bad responses (4xx and 5xx)
            return JsonResponse(response.json())  # Assuming the response is JSON
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)
        except Exception as e:
            return JsonResponse({'message': str(e)}, status=500)

"""
View for getting DataCite metrics details from publications.
"""
class PublicationDataCiteEventsView(BaseApiView):
    def get(self, request):
        doi = request.GET.get('doi', '')
        source_id = request.GET.get('source-id', 'datacite-usage')

        url = f'https://api.datacite.org/events?source-id={source_id}&doi={doi}'

        try:
            response = requests.get(url)
            response.raise_for_status()  
            events = response.json()     
            return JsonResponse(events)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
