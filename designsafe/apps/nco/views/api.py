"""NCO REST API views.

.. module:: designsafe.apps.nco.views.api
    :synopsis: Views for NCO REST API.
"""
import logging
from django.http import JsonResponse
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.nco.managers import NcoProjectsManager


LOG = logging.getLogger(__name__)


class ProjectsListView(BaseApiView):
    """Nco Projects List view."""

    def get(self, request):
        """Return a list of all projects."""
        mgr = NcoProjectsManager(request.user)
        return JsonResponse({
            "status": "OK",
            "response": [
                prj for prj in mgr.projects()
            ]
        })
