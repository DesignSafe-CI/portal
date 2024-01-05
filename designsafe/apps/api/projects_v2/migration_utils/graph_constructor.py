"""Utils for constructing project trees from legacy association IDs."""
import json
from typing import TypedDict, Optional
from uuid import uuid4
from pathlib import Path
import networkx as nx
from django.utils.text import slugify
from designsafe.apps.api.agave import service_account
from designsafe.apps.data.models.elasticsearch import IndexedPublication
from designsafe.apps.projects.managers.publication import FIELD_MAP
from designsafe.apps.api.projects_v2.schema_models import PATH_SLUGS
from designsafe.apps.projects.models.categories import Category
from designsafe.apps.api.projects_v2 import constants as names
from designsafe.apps.api.projects_v2.migration_utils.publication_transforms import (
    transform_entity,
    construct_users,
)

# map metadata 'name' field to allowed (direct) children
ALLOWED_RELATIONS = {
    names.PROJECT: [
        names.EXPERIMENT,
        names.SIMULATION,
        names.HYBRID_SIM,
        names.FIELD_RECON_MISSION,
        names.FIELD_RECON_REPORT,
    ],
    # Experimental
    names.EXPERIMENT: [
        names.EXPERIMENT_ANALYSIS,
        names.EXPERIMENT_REPORT,
        names.EXPERIMENT_MODEL_CONFIG,
    ],
    names.EXPERIMENT_MODEL_CONFIG: [names.EXPERIMENT_SENSOR],
    names.EXPERIMENT_SENSOR: [names.EXPERIMENT_EVENT],
    # Simulation
    names.SIMULATION: [
        names.SIMULATION_ANALYSIS,
        names.SIMULATION_REPORT,
        names.SIMULATION_MODEL,
    ],
    names.SIMULATION_MODEL: [names.SIMULATION_INPUT],
    names.SIMULATION_INPUT: [names.SIMULATION_OUTPUT],
    # Hybrid sim
    names.HYBRID_SIM: [
        names.HYBRID_SIM_REPORT,
        names.HYBRID_SIM_GLOBAL_MODEL,
        names.HYBRID_SIM_ANALYSIS,
    ],
    names.HYBRID_SIM_GLOBAL_MODEL: [names.HYBRID_SIM_COORDINATOR],
    names.HYBRID_SIM_COORDINATOR: [
        names.HYBRID_SIM_COORDINATOR_OUTPUT,
        names.HYBRID_SIM_SIM_SUBSTRUCTURE,
        names.HYBRID_SIM_EXP_SUBSTRUCTURE,
    ],
    names.HYBRID_SIM_SIM_SUBSTRUCTURE: [names.HYBRID_SIM_SIM_OUTPUT],
    names.HYBRID_SIM_EXP_SUBSTRUCTURE: [names.HYBRID_SIM_EXP_OUTPUT],
    # Field Recon
    names.FIELD_RECON_MISSION: [
        names.FIELD_RECON_COLLECTION,
        names.FIELD_RECON_PLANNING,
        names.FIELD_RECON_SOCIAL_SCIENCE,
        names.FIELD_RECON_GEOSCIENCE,
    ],
}


def get_entities_by_project_id(project_id: str) -> list[dict]:
    """Return all entities matching a project ID, with the root as element 0."""
    client = service_account()
    base_query = {"value.projectId": project_id, "name": "designsafe.project"}
    root_project_listing = client.meta.listMetadata(q=json.dumps(base_query))
    root_project_meta = root_project_listing[0]

    project_uuid = root_project_meta["uuid"]

    associations_query = {"associationIds": project_uuid}
    associated_entities = client.meta.listMetadata(q=json.dumps(associations_query))

    return list(map(dict, root_project_listing + associated_entities))


def get_path(graph: nx.DiGraph, node_id: str):
    """Iterate through all predecessors in the graph (inclusive)"""
    shortest_path = nx.shortest_path(graph, "NODE_ROOT", node_id)
    path_uuids = map(lambda node: graph.nodes[node]["uuid"], shortest_path)

    return list(path_uuids)


def construct_graph(project_id) -> nx.DiGraph:
    """Construct a directed graph from a project's association IDs."""
    entity_listing = get_entities_by_project_id(project_id)
    root_entity = entity_listing[0]

    project_graph = nx.DiGraph()
    root_node_id = "NODE_ROOT"
    root_node_data = {
        "uuid": root_entity["uuid"],
        "name": root_entity["name"],
    }
    project_graph.add_node(root_node_id, **root_node_data)

    construct_graph_recurse(project_graph, entity_listing, root_entity, root_node_id)

    deprecated_mission_nodes = (
        node
        for (node, data) in project_graph.nodes.data()
        if data["name"] == names.FIELD_RECON_COLLECTION
    )
    project_graph.remove_nodes_from(deprecated_mission_nodes)

    return project_graph


def construct_graph_recurse(
    graph: nx.DiGraph,
    entity_list: list[dict],
    parent: dict,
    parent_node_id: str,
):
    """Recurse through an entity's children and add nodes/edges. B is a child of A if
    all of A's descendants are referenced in B's association IDs."""

    # Handle legacy hybrid sim projects with incomplete associationIds arrays.
    association_path = get_path(graph, parent_node_id)
    if parent["name"] in [
        "designsafe.project.hybrid_simulation.sim_substructure",
        "designsafe.project.hybrid_simulation.exp_substructure",
    ]:
        association_path.pop(-2)

    children = filter(
        lambda child: (
            child["name"] in ALLOWED_RELATIONS.get(parent["name"], [])
            and set(child["associationIds"]) >= set(association_path)
        ),
        entity_list,
    )

    for idx, child in enumerate(children):
        child_node_id = f"NODE_{uuid4()}"
        child_order = next(
            (
                order["value"]
                for order in get_entity_orders(child)
                if order["parent"] == parent["uuid"]
            ),
            idx,
        )

        child_data = {
            "uuid": child["uuid"],
            "name": child["name"],
            "order": child_order,
        }
        graph.add_node(child_node_id, **child_data)
        graph.add_edge(parent_node_id, child_node_id)
        construct_graph_recurse(graph, entity_list, child, child_node_id)


def get_entities_from_publication(project_id: str, version=None):
    """Loop through a publication's fields and construct a flat entity list."""
    entity_fields: list[str] = list(FIELD_MAP.values())
    pub = IndexedPublication.from_id(project_id, revision=version)

    entity_list = [pub.project.to_dict()]
    for field in entity_fields:
        field_entities = [e.to_dict() for e in getattr(pub, field, [])]
        entity_list += field_entities

    return entity_list


def construct_publication_graph(project_id, version=None) -> nx.DiGraph:
    """Construct a directed graph from a publications's association IDs."""
    entity_listing = get_entities_from_publication(project_id, version=version)
    root_entity = entity_listing[0]

    pub_graph = nx.DiGraph()

    project_type = root_entity["value"]["projectType"]

    root_node_id = "NODE_ROOT"
    if project_type == "other":
        root_node_data = {"uuid": None, "name": None, "projectType": "other"}
    else:
        root_node_data = {
            "uuid": root_entity["uuid"],
            "name": root_entity["name"],
            "projectType": root_entity["value"]["projectType"],
        }
    pub_graph.add_node(root_node_id, **root_node_data)
    if project_type == "other":
        base_node_data = {
            "uuid": root_entity["uuid"],
            "name": root_entity["name"],
            "projectType": root_entity["value"]["projectType"],
        }
        base_node_id = f"NODE_{uuid4()}"
        pub_graph.add_node(base_node_id, **base_node_data)
        pub_graph.add_edge(root_node_id, base_node_id)
    construct_graph_recurse(pub_graph, entity_listing, root_entity, root_node_id)

    pub_graph.nodes["NODE_ROOT"]["basePath"] = f"{project_id}"
    pub_graph = construct_entity_filepaths(entity_listing, pub_graph, version)

    return pub_graph


def construct_entity_filepaths(
    entity_listing: list[dict], pub_graph: nx.DiGraph, version: Optional[int] = None
):
    """
    Walk the publication graph and construct base file paths for each node.
    The file path for a node contains the titles of each entity above it in the
    hierarchy. Returns the publication graph with basePath data added for each node.
    """
    for parent_node, child_node in nx.bfs_edges(pub_graph, "NODE_ROOT"):
        # Construct paths based on the entity hierarchy
        parent_base_path = pub_graph.nodes[parent_node]["basePath"]
        entity_name_slug = PATH_SLUGS.get(pub_graph.nodes[child_node]["name"])
        entity_title = next(
            e["value"]["title"]
            for e in entity_listing
            if e["uuid"] == pub_graph.nodes[child_node]["uuid"]
        )
        entity_dirname = f"{entity_name_slug}--{slugify(entity_title)}"

        if version and child_node in pub_graph.successors("NODE_ROOT"):
            # Version datasets if the containing publication is versioned.
            child_path = Path(parent_base_path) / f"{entity_dirname}--v{version}"
        elif parent_node in pub_graph.successors("NODE_ROOT"):
            # Publishable entities have a "data" folder in Bagit ontology.
            child_path = Path(parent_base_path) / "data" / entity_dirname
        else:
            child_path = Path(parent_base_path) / entity_dirname

        pub_graph.nodes[child_node]["basePath"] = str(child_path)
    return pub_graph


class EntityOrder(TypedDict):
    """Representation for UI orders stored in legacy metadata."""

    value: int
    parent: str


def get_entity_orders(
    entity: dict,
) -> list[EntityOrder]:
    """extract ordering metadata for a project or pub."""
    pub_orders = entity.get("_ui", None)
    if pub_orders:
        return entity["_ui"].get("orders", [])

    prj_orders = Category.objects.filter(uuid=entity["uuid"]).first()
    if not prj_orders:
        return []
    return prj_orders.to_dict().get("orders", [])


def transform_pub_entities(project_id: str, version: Optional[int] = None):
    """Validate publication entities against their corresponding model."""
    entity_listing = get_entities_from_publication(project_id, version=version)
    base_pub_meta = IndexedPublication.from_id(project_id, revision=version).to_dict()
    pub_graph = construct_publication_graph(project_id, version)

    for _, node_data in pub_graph.nodes.items():
        node_entity = next(
            (e for e in entity_listing if e["uuid"] == node_data["uuid"]), None
        )
        if not node_entity:
            continue
        data_path = str(Path(node_data["basePath"]) / "data")
        new_entity_value = transform_entity(node_entity, base_pub_meta, data_path)
        node_data["value"] = new_entity_value

    project_users = construct_users(entity_listing[0])
    base_node = next(
        node
        for (node, node_data) in pub_graph.nodes.items()
        if node_data["uuid"] == entity_listing[0]["uuid"]
    )
    pub_graph.nodes[base_node]["value"]["users"] = project_users

    for pub in pub_graph.successors("NODE_ROOT"):
        if version and version > 1:
            pub_graph.nodes[pub]["version"] = version
            pub_graph.nodes[pub]["versionInfo"] = base_pub_meta.get(
                "revisionText", None
            )
            pub_graph.nodes[pub]["versionDate"] = base_pub_meta.get(
                "revisionDate", None
            )
        else:
            pub_graph.nodes[pub]["version"] = 1

    return pub_graph


def combine_pub_versions(project_id: str) -> nx.DiGraph:
    """Construct a tree of all versions of published datasets in a project."""
    latest_version: int = IndexedPublication.max_revision(project_id)

    pub_graph = transform_pub_entities(project_id)
    if not latest_version:
        return pub_graph

    versions = range(2, latest_version + 1)
    for version in versions:
        version_graph = transform_pub_entities(project_id, version)
        version_pubs = version_graph.successors("NODE_ROOT")
        pub_graph: nx.DiGraph = nx.compose(pub_graph, version_graph)
        for node_id in version_pubs:
            pub_graph.add_edge("NODE_ROOT", node_id)

    return pub_graph
