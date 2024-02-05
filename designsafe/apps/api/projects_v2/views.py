"""Placeholder views module"""

import logging
from django.http import HttpRequest, JsonResponse
from designsafe.apps.api.views import BaseApiView, ApiException

logger = logging.getLogger(__name__)


class ProjectsView(BaseApiView):
    """View for listing and creating projects"""

    def get(self, request: HttpRequest):
        """Return the list of projects for a given user."""
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 100))
        # user = get_user_model().objects.get(username="ds_admin")
        user = request.user

        if not getattr(user, "username", None):
            raise ApiException("Unauthenticated user", status=401)

        projects = user.projects.order_by("last_updated")[offset : offset + limit]
        total = user.projects.count()

        project_json = {
            "result": [
                {
                    "uuid": project.uuid,
                    "name": project.name,
                    "value": project.value,
                    "lastUpdated": project.last_updated,
                    "created": project.created,
                }
                for project in projects
            ],
            "total": total,
        }

        return JsonResponse(project_json)

    def post(self, request: HttpRequest):
        """Create a new project."""


class ProjectInstanceView(BaseApiView):
    """View for listing/updating project entities."""

    def get(self, request: HttpRequest, project_id: str):
        """Return all project metadata for a project ID"""

    def put(self, request):
        """Update a project's root metadata"""

    def post(self, request, project_id):
        """Add a new metadata entity."""
