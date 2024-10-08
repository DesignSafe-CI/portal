"""Integration-type tests to confirm that Pydantic schemas are exhaustive."""

import json
from typing import Iterator
import networkx as nx
from pydantic import BaseModel, ValidationError
from designsafe.apps.api.projects_v2.operations.datacite_operations import (
    get_datacite_json,
)
from designsafe.apps.api.projects_v2.schema_models.base import BaseProject
from designsafe.apps.api.projects_v2.migration_utils.graph_constructor import (
    transform_pub_entities,
)
from designsafe.apps.api.agave import get_service_account_client_v2 as service_account
from designsafe.apps.api.publications.operations import listing as list_pubs
from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata
from designsafe.apps.api.projects_v2.operations.project_publish_operations import (
    get_publication_full_tree,
)


def update_project(uuid, new_value):
    """Utility for patching a dict into entity metadata."""
    client = service_account()
    meta = client.meta.getMetadata(uuid=uuid)
    meta["value"] = {**meta["value"], **new_value}

    meta["lastUpdated"] = meta["lastUpdated"].isoformat()
    meta["created"] = meta["created"].isoformat()
    return client.meta.updateMetadata(uuid=uuid, body=dict(meta))


def iterate_entities(name="designsafe.project") -> Iterator[dict]:
    """Yield all entities for a given namespace"""
    client = service_account()
    query = {"name": name}
    offset = 0
    limit = 100
    while True:
        listing = client.meta.listMetadata(
            q=json.dumps(query), offset=offset, limit=limit
        )
        yield from listing

        if len(listing) < limit:
            break

        offset += limit


def validate_entities(name: str = "designsafe.project", model: BaseModel = BaseProject):
    """Validate a Pydantic model against all instances of an entity namespace."""
    gen = iterate_entities(name)
    for entity in gen:
        try:
            validated_model = model.model_validate(entity["value"])
            model_json = validated_model.model_dump()
            # Assert that subsequent validation does not affect the data.
            assert model.model_validate(model_json).model_dump() == model_json
        except ValidationError as exc:
            print(entity["uuid"])
            print(entity)
            print(exc)


def iterate_pubs():
    """Returns an iterator over all publications."""
    offset = 0
    limit = 100
    while True:
        listing = list_pubs(offset=offset, limit=limit)
        res = listing["listing"]
        yield from res

        if len(res) < limit:
            break

        offset += limit


def validate_publications():
    """Attempt graph construction for all publications."""
    all_pubs = iterate_pubs()
    for pub in all_pubs:
        # print(pub["projectId"])
        try:
            transform_pub_entities(pub["projectId"])
        except ValidationError as exc:
            print(pub["projectId"])
            print(exc)


def validate_datacite_json():
    """Attempt to generate datacite json for all publishable entities"""
    graphs = ProjectMetadata.objects.filter(name="designsafe.project.graph")
    for graph in graphs:
        graph_obj = nx.node_link_graph(graph.value)

        project_type = graph.base_project.value["projectType"]
        if project_type == "None":
            continue
        project_id = graph.base_project.value["projectId"]

        publishable_uuids = [
            graph_obj.nodes[node_id]["uuid"]
            for node_id in graph_obj.successors("NODE_ROOT")
        ]
        if not publishable_uuids:
            continue

        full_tree, _ = get_publication_full_tree(project_id, publishable_uuids)

        for pub_id in publishable_uuids:
            get_datacite_json(full_tree, pub_id)
