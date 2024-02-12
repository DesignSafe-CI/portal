"""Placeholder views module"""

import logging
from django.http import HttpRequest, JsonResponse
from django.db import models
from designsafe.apps.api.views import BaseApiView, ApiException
from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata
from designsafe.apps.api.projects_v2 import constants
import networkx as nx

logger = logging.getLogger(__name__)


class ProjectsView(BaseApiView):
    """View for listing and creating projects"""

    def get(self, request: HttpRequest):
        """Return the list of projects for a given user."""
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 100))
        # user = get_user_model().objects.get(username="ds_admin")
        user = request.user

        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        projects = user.projects.order_by("last_updated")[offset : offset + limit]
        total = user.projects.count()

        project_json = {
            "result": [project.to_dict() for project in projects],
            "total": total,
        }

        return JsonResponse(project_json)

    def post(self, request: HttpRequest):
        """Create a new project."""


class ProjectInstanceView(BaseApiView):
    """View for listing/updating project entities."""

    def get(self, request: HttpRequest, project_id: str):
        """Return all project metadata for a project ID"""
        user = request.user
        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        entities = ProjectMetadata.objects.filter(base_project=project)
        return JsonResponse(
            {
                "baseProject": project.to_dict(),
                "entities": [
                    e.to_dict() for e in entities if e.name != constants.PROJECT
                ],
                "tree": nx.tree_data(nx.node_link_graph(project.project_graph.value), 'NODE_ROOT')
            }
        )

    def put(self, request):
        """Update a project's root metadata"""

    def post(self, request, project_id):
        """Add a new metadata entity."""
