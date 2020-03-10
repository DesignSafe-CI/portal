"""NCO REST API views.

.. module:: designsafe.apps.nco.views.api
    :synopsis: Views for NCO REST API.
"""
import json
import logging
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.nco.managers import NcoProjectsManager
from designsafe.libs.mongo.response import MongoJsonResponse


LOG = logging.getLogger(__name__)


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
