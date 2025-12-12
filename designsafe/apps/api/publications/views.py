from designsafe.apps.api.views import BaseApiView
from django.http import JsonResponse, HttpResponseForbidden
from designsafe.apps.api.agave import get_service_account_client
from django.conf import settings
from requests.exceptions import HTTPError
from designsafe.apps.api.publications import operations
from designsafe.apps.api.publications.operations import (
    clarivate_single_api,
    clarivate_wos_exp_single_api_basic,
    build_citation_json,
)
from designsafe.apps.projects.managers import datacite as DataciteManager
from django.utils.decorators import method_decorator
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

        url = f'https://api.datacite.org/events?source-id={source_id}&page[size]=1000&doi={doi}'

        try:
            response = requests.get(url)
            response.raise_for_status()  
            events = response.json()     
            return JsonResponse(events)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
        
"""
API endpoint to retrieve Clarivate citation count for a single DOI.
"""

class PublicationClarivateView(BaseApiView):
    def get(self, request):
        doi = (request.GET.get('doi') or '').strip()
        include = (request.GET.get('include') or '').strip().lower()
        include_records = include in ('records', 'citations', 'all', 'true', '1')
        debug_flag = (request.GET.get('debug') or '').lower() in ('1', 'true', 'yes')

        if not doi:
            return JsonResponse({'error': 'DOI parameter is required'}, status=400)

        logger.info(
            "CLARIVATE MISS: doi=%s include_records=%s", doi, include_records
        )

        payload = {'doi': doi, 'citations': []}
        debug_info = {}

        # Starter count 
        count = clarivate_single_api(doi)
        payload['citation_count'] = int(count)
        logger.info("CLARIVATE starter-count: doi=%s count=%s", doi, payload['citation_count'])

        # Expanded list
        if include_records:
            try:
                raw = clarivate_wos_exp_single_api_basic(doi, debug=debug_info)

                found = int(((raw or {}).get('QueryResult') or {}).get('RecordsFound') or 0)
                recs_field = (((raw or {}).get('Data') or {}).get('Records') or {}).get('records')
                debug_info['records_found'] = found
                debug_info['records_field_type'] = type(recs_field).__name__ if recs_field is not None else 'NoneType'
                logger.info(
                    "CLARIVATE expanded-citing: doi=%s records_found=%s",
                    doi, recs_field
                )

                if found > 0:
                    try:
                        payload['citations'] = build_citation_json(raw)
                    except Exception as e:
                        log.warning('build_citation_json failed: %s', e)
                        debug_info['normalize_error'] = str(e)

            except Exception as e:
                debug_info['expanded_error'] = str(e)
                debug_info['expanded_trace_tail'] = traceback.format_exc().splitlines()[-3:]
                logger.warning("CLARIVATE expanded error: doi=%s err=%s", doi, e, exc_info=False)

        if debug_flag and debug_info:
            payload['_debug'] = debug_info

        return JsonResponse(payload)