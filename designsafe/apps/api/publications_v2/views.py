"""Views for published data"""

import logging
import json
import networkx as nx
from django.db import models
from django.http import HttpRequest, JsonResponse
from designsafe.apps.api.views import BaseApiView, ApiException
from designsafe.apps.api.publications_v2.models import Publication
from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata
from designsafe.apps.api.projects_v2.operations.project_publish_operations import (
    publish_project,
)

logger = logging.getLogger(__name__)


class PublicationListingView(BaseApiView):
    """List all publications."""

    def get(self, request: HttpRequest):
        """Fetch the publication listing."""
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 100))

        publications = Publication.objects.defer("tree").order_by("-created")[
            offset : offset + limit
        ]
        total = Publication.objects.count()
        result = [
            {
                "projectId": pub.value["projectId"],
                "title": pub.value["title"],
                "description": pub.value["description"],
                "pi": next(
                    (user for user in pub.value["users"] if user["role"] == "pi"), None
                ),
                "created": pub.created,
            }
            for pub in publications
        ]
        return JsonResponse({"result": result, "total": total})


class PublicationDetailView(BaseApiView):
    """View for retrieving publication details."""

    def get(self, request: HttpRequest, project_id, version=None):
        """Returns the tree view and base project metadata for a publication."""
        try:
            pub_meta = Publication.objects.get(project_id=project_id)
        except Publication.DoesNotExist as exc:
            raise ApiException(status=404, message="Publication not found.") from exc

        tree_json = nx.tree_data(nx.node_link_graph(pub_meta.tree), "NODE_ROOT")

        return JsonResponse({"tree": tree_json, "baseProject": pub_meta.value})


class PublicationPublishView(BaseApiView):
    """view for publishing a project."""

    def post(self, request: HttpRequest):
        """Create a new publication from a project."""
        user = request.user
        request_body = json.loads(request.body)
        logger.debug(request_body)

        project_id = request_body.get("projectId", None)
        entities_to_publish = request_body.get("entityUuids", None)

        if (not project_id) or (not entities_to_publish):
            raise ApiException("Missing project ID or entity list.", status=400)

        try:
            user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        publish_project(project_id, entities_to_publish, dry_run=False)
        logger.debug(project_id)
        logger.debug(entities_to_publish)
        return JsonResponse({"result": "OK"})
