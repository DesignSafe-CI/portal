"""Views for published data"""

import logging
import json
import networkx as nx
from django.db import models
from django.http import HttpRequest, JsonResponse
from designsafe.apps.api.views import BaseApiView, ApiException
from designsafe.apps.api.publications_v2.models import Publication
from designsafe.apps.api.publications_v2.elasticsearch import IndexedPublication
from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata
from designsafe.apps.api.projects_v2.operations.project_publish_operations import (
    publish_project_async,
)

logger = logging.getLogger(__name__)


def handle_search(query_opts: dict, offset=0, limit=100):
    from elasticsearch_dsl import Q

    logger.debug(offset)

    query = IndexedPublication.search()

    if project_type_query := query_opts["project-type"]:
        query = query.filter("terms", **{"nodes.value.projectType": project_type_query})

    if facility_query := query_opts["facility"]:
        query = query.filter(
            Q("term", **{"nodes.value.facility.id.keyword": facility_query})
            | Q("term", **{"nodes.value.facilities.id.keyword": facility_query})
        )
    if nh_type_query := query_opts["nh-type"]:
        query = query.filter(
            Q("term", **{"nodes.value.nhTypes.id.keyword": nh_type_query})
            | Q("term", **{"nodes.value.nhTypes": nh_type_query})
        )

    if pub_year_query := query_opts["pub-year"]:
        query = query.filter(
            Q(
                {
                    "range": {
                        "nodes.publicationDate": {
                            "gte": f"{pub_year_query}||/y",
                            "lte": f"{pub_year_query}||/y",
                            "format": "yyyy",
                        }
                    }
                }
            )
        )

    if nh_year_query := query_opts["nh-year"]:
        query = query.filter(
            Q(
                {
                    "range": {
                        "nodes.value.nhEventStart": {
                            "gte": f"{nh_year_query}||/y",
                            "lte": f"{nh_year_query}||/y",
                            "format": "yyyy",
                        }
                    }
                }
            )
        )

    if experiment_type_query := query_opts["experiment-type"]:
        query = query.filter(
            Q(
                "term",
                **{"nodes.value.experimentType.id.keyword": experiment_type_query},
            )
        )

    if sim_type_query := query_opts["sim-type"]:
        query = query.filter(
            Q(
                "term",
                **{"nodes.value.simulationType.id.keyword": sim_type_query},
            )
        )

    if fr_type_query := query_opts["fr-type"]:
        query = query.filter(
            Q(
                "term",
                **{"nodes.value.frTypes.id.keyword": fr_type_query},
            )
        )

    if hyb_sim_type_query := query_opts["hyb-sim-type"]:
        query = query.filter(
            Q(
                "term",
                **{"nodes.value.simulationType.id.keyword": hyb_sim_type_query},
            )
        )

    if data_type_query := query_opts["data-type"]:
        query = query.filter(
            Q(
                "term",
                **{"nodes.value.dataType.id.keyword": data_type_query},
            )
        )

    if search_string := query_opts["q"]:
        qs_query = Q(
            "query_string",
            query=search_string,
            default_operator="AND",
            type="cross_fields",
            fields=[
                "nodes.value.description",
                "nodes.value.keywords",
                "nodes.value.title",
                "nodes.value.projectId",
                "nodes.value.projectType",
                "nodes.value.dataType",
                "nodes.value.authors",
                "nodes.value.authors.fname",
                "nodes.value.authors.lname",
                "nodes.value.authors.username",
                "nodes.value.authors.inst",
            ],
        )
        term_query = Q({"term": {"nodes.value.projectId.keyword": search_string}})
        query = query.filter(qs_query | term_query)

    hits = (
        query.extra(from_=offset, size=limit)
        .sort({"nodes.publicationDate": {"order": "desc"}})
        .source([""])
        .execute()
        .hits
    )
    returned_ids = [hit.meta.id for hit in hits]

    return returned_ids, hits.total.value


class PublicationListingView(BaseApiView):
    """List all publications."""

    def get(self, request: HttpRequest):
        """Fetch the publication listing."""
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 100))

        # Search/filter params
        query_opts = {
            "q": request.GET.get("q", None),
            "project-type": request.GET.getlist("project-type", []),
            "nh-type": request.GET.get("nh-type", None),
            "pub-year": request.GET.get("pub-year", None),
            "facility": request.GET.get("facility", None),
            "experiment-type": request.GET.get("experiment-type", None),
            "sim-type": request.GET.get("sim-type", None),
            "fr-type": request.GET.get("fr-type", None),
            "nh-year": request.GET.get("nh-year", None),
            "hyb-sim-type": request.GET.get("hyb-sim-type", None),
            "data-type": request.GET.get("data-type", None),
        }

        has_query = any(query_opts.values())
        if has_query:
            hits, total = handle_search(query_opts, offset, limit)
            publications_query = (
                Publication.objects.filter(project_id__in=hits)
                .defer("tree")
                .order_by("-created")
            )
            publications = publications_query
        else:
            publications_query = Publication.objects.defer("tree").order_by("-created")
            total = publications_query.count()
            publications = publications_query[offset : offset + limit]
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

        publish_project_async.apply_async([project_id, entities_to_publish])
        logger.debug(project_id)
        logger.debug(entities_to_publish)
        return JsonResponse({"result": "OK"})
