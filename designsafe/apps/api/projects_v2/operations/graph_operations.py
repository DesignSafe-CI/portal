"""Utilities for adding, removing, and reordering nodes in the project graph."""
import uuid
import networkx as nx
from django.db import transaction
from designsafe.apps.api.projects_v2 import constants
from designsafe.apps.api.projects_v2.models import ProjectMetadata


def _add_node_to_graph(
    graph: nx.DiGraph, parent_node_id: str, child_node_data: dict
) -> nx.DiGraph:
    """Add a node with data to a graph, and return the graph."""
    if not graph.has_node(parent_node_id):
        raise nx.exception.NodeNotFound

    _graph: nx.DiGraph = graph.copy()
    child_node_id = f"NODE_{child_node_data['name']}_{uuid.uuid4()}"
    _graph.add_node(child_node_id, **child_node_data)
    _graph.add_edge(parent_node_id, child_node_id)
    return _graph


def _remove_nodes_from_graph(graph: nx.DiGraph, node_ids: list[str]) -> nx.DiGraph:
    """Remove a node from a graph, including its successors."""

    _graph: nx.DiGraph = graph.copy()
    nodes_to_remove = set()
    for node_id in node_ids:
        # dfs_preorder_nodes iterates over all nodes reachable from node_id.
        reachable_nodes = nx.dfs_preorder_nodes(_graph, node_id)
        nodes_to_remove.update(reachable_nodes)

    _graph.remove_nodes_from(nodes_to_remove)
    return _graph


class InvalidNodeReorderException(Exception):
    """Raise when an invalid index is passed during node reordering."""


def _reorder_nodes(graph: nx.DiGraph, node_id: str, new_index: int):
    """Reorder nodes in a graph."""
    _graph: nx.DiGraph = graph.copy()

    parent = next(_graph.predecessors(node_id))
    siblings = _graph.successors(parent)
    node_at_new_index = next(
        (s for s in siblings if _graph.nodes.get(s)["order"] == new_index), None
    )
    if node_at_new_index is None:
        # We are trying to move a node to a non-existent index
        raise InvalidNodeReorderException

    current_index = _graph.nodes.get(node_id)["order"]

    _graph.nodes.get(node_at_new_index)["order"] = current_index
    _graph.nodes.get(node_id)["order"] = new_index

    return _graph


def initialize_project_graph(project_id: str):
    """
    Initialize the entity graph in a default state for a project. For type Other, the
    default graph has an "empty" root node that contains the base entity as its child.
    This is to allow multiple versions to be published as siblings in the graph.
    Otherwise, the graph is initialized as a single node pointing to the project root.
    This method should be called when creating a new project AND when changing a
    project's type.
    """
    project_model = ProjectMetadata.get_project_by_id(project_id)
    project_graph = nx.DiGraph()

    root_node_id = "NODE_ROOT"
    project_type = project_model.value.get("projectType", None)
    base_node_data = {
        "uuid": project_model.uuid,
        "name": project_model.name,
        "projectType": project_type,
    }

    if project_type == "other":
        # type Other projects have a parent node above the project root, to support
        # multiple versions.
        project_graph.add_node(
            root_node_id, **{"uuid": None, "name": None, "projectType": "other"}
        )
        base_node_id = f"NODE_project_{uuid.uuid4()}"
        project_graph.add_node(f"NODE_project_{uuid.uuid4()}", **base_node_data)
        project_graph.add_edge(root_node_id, base_node_id)
    else:
        project_graph.add_node(root_node_id, **base_node_data)

    graph_model_value = nx.node_link_data(project_graph)
    res, _ = ProjectMetadata.objects.update_or_create(
        name=constants.PROJECT_GRAPH,
        base_project=project_model,
        defaults={"value": graph_model_value},
    )
    return res


def add_node_to_project(project_id: str, parent_node: str, node_data: dict):
    """Update the database entry for a project graph to add a node."""
    # Lock the project graph's tale row to prevent conflicting updates.
    with transaction.atomic():
        graph_model = ProjectMetadata.objects.select_for_update().get(
            name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
        )
        project_graph = nx.node_link_graph(graph_model.value)

        updated_graph = _add_node_to_graph(project_graph, parent_node, node_data)

        graph_model.value = updated_graph
        graph_model.save()


def remove_nodes_from_project(project_id: str, node_ids: list[str]):
    """Update the database entry for the project graph to remove nodes."""
    # Lock the project graph's tale row to prevent conflicting updates.
    with transaction.atomic():
        graph_model = ProjectMetadata.objects.select_for_update().get(
            name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
        )
        project_graph = nx.node_link_graph(graph_model.value)

        updated_graph = _remove_nodes_from_graph(project_graph, node_ids)

        graph_model.value = updated_graph
        graph_model.save()


def reorder_project_nodes(project_id: str, node_id: str, new_index: int):
    """Update the database entry for the project graph to reorder nodes."""
    # Lock the project graph's tale row to prevent conflicting updates.
    with transaction.atomic():
        graph_model = ProjectMetadata.objects.select_for_update().get(
            name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
        )
        project_graph = nx.node_link_graph(graph_model.value)

        updated_graph = _reorder_nodes(project_graph, node_id, new_index)

        graph_model.value = updated_graph
        graph_model.save()
