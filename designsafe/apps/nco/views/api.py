"""NCO REST API views.

.. module:: designsafe.apps.nco.views.api
    :synopsis: Views for NCO REST API.
"""
import json
import logging
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.nco.managers import NcoProjectsManager, NcoTtcGrantsManager
from designsafe.libs.mongo.response import MongoJsonResponse


logger = logging.getLogger(__name__)


class ProjectsListView(BaseApiView):
    """Nco Projects List view."""

    def get(self, request):
        """Return a list of all projects.

        :param int page_number: Page number to return.
        :param int page_size: Page size to use, default 10.
        :param list sorts: Sort dictionary in the form:
            ```
            [{
                "name": "key name",
                "value": 1 # 1 (asc) or -1 (desc)
            }]
            ```
        :param list filters: Filter dictionary in the form:
            ```
            [{
                "name": "facility",
                "value": "Facility Name",
            }, ...]
            ```
        """
        mgr = NcoProjectsManager(request.user)
        filters = [json.loads(val) for val in request.GET.getlist("filters")]
        page_number = int(request.GET.get('pageNumber', "0"))
        sorts = request.GET.getlist("sorts")
        page_size = int(request.GET.get("pageSize", "25"))
        total, prjs = mgr.projects(
            page_number=page_number,
            filters=filters,
            sorts=sorts,
            page_size=page_size,
        )
        return MongoJsonResponse({
            "status": "OK",
            "response": prjs,
            "total": total,
            "pageNumber": page_number,
            "pageSize": page_size,
        })


class FiltersListView(BaseApiView):
    """Nco Filters List view."""

    def get(self, request):
        """Return a list of possible filters."""
        mgr = NcoProjectsManager(request.user)
        filters = mgr.filters()
        return MongoJsonResponse({
            "status": "OK",
            "response": filters,
        })

class TtcGrantsView(BaseApiView):
    """NCO TTC Grants View."""

    def get(self,request):
        """Return a list of all TTC Grants."""
        ttc_mgr = NcoTtcGrantsManager(request.user)
        facility = request.GET.get('facility')
        category = request.GET.get('category')
        sort = request.GET.get('sort')
        hazard_type = request.GET.get('hazard_type')
        grant_type = request.GET.get('grant_type')
        text_search = request.GET.get('text_search')

        params = {
            'facility': facility,
            'category': category,
            'sort': sort,
            'hazard_type': hazard_type,
            'grant_type': grant_type,
            'text_search': text_search,
        }

        grants = ttc_mgr.ttc_grants(params)
        return MongoJsonResponse({
            "status": "OK",
            "response": grants,
        })

class TtcFacilitiesView(BaseApiView):
    """NCO TTC Grants Facilities View."""

    def get(self,request):
        ttc_mgr = NcoTtcGrantsManager(request.user)
        facilities = ttc_mgr.ttc_facilities()
        return MongoJsonResponse({
            "status": "OK",
            "response": facilities,
        })

class TtcCategoriesView(BaseApiView):
    """NCO TTC Grants Facilities View."""

    def get(self,request):
        ttc_mgr = NcoTtcGrantsManager(request.user)
        categories = ttc_mgr.ttc_categories()
        return MongoJsonResponse({
            "status": "OK",
            "response": categories,
        })

class TtcGrantTypesView(BaseApiView):
    """NCO TTC Grant Types View."""

    def get(self,request):
        ttc_mgr = NcoTtcGrantsManager(request.user)
        grant_types = ttc_mgr.ttc_grant_types()
        return MongoJsonResponse({
            "status": "OK",
            "response": grant_types,
        })

class TtcHazardTypesView(BaseApiView):
    """NCO TTC Hazard Types View."""

    def get(self,request):
        ttc_mgr = NcoTtcGrantsManager(request.user)
        hazard_types = ttc_mgr.ttc_hazard_types()
        return MongoJsonResponse({
            "status": "OK",
            "response": hazard_types,
        })