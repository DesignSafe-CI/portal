"""Views for published data"""

import logging
import networkx as nx
from django.http import HttpRequest, JsonResponse
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.publications_v2.models import Publication

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

    def get(self, request: HttpRequest, project_id):
        """Returns the tree view and base project metadata for a publication."""
        pub_meta = Publication.objects.get(project_id=project_id)

        tree_json = nx.tree_data(nx.node_link_graph(pub_meta.tree), "NODE_ROOT")

        return JsonResponse({"tree": tree_json, "baseProject": pub_meta.value})
