"""Utilities for adding, removing, and reordering nodes in the project graph."""
import uuid
import copy
import networkx as nx
from django.db import transaction
from designsafe.apps.api.projects_v2 import constants
from designsafe.apps.api.projects_v2.models import ProjectMetadata


def _get_next_child_order(graph: nx.DiGraph, parent_node: str) -> int:
    child_nodes = graph.successors(parent_node)
    max_order = max((graph.nodes[child]["order"] for child in child_nodes), default=-1)
    return int(max_order) + 1


def _renormalize_ordering(graph: nx.DiGraph) -> nx.DiGraph:
    """
    Update order attributes on graph nodes so that the orders for each node's children
    form a sequence from 0..(n-1) where n is the number of children.
    """
    for node in graph.nodes:
        sorted_children = sorted(
            graph.successors(node), key=lambda n: graph.nodes[n]["order"]
        )
        for i, node_id in enumerate(sorted_children):
            graph.nodes[node_id]["order"] = i
    return graph


def _add_node_to_graph(
    graph: nx.DiGraph, parent_node_id: str, meta_uuid: str, name: str
) -> tuple[nx.DiGraph, str]:
    """Add a node with data to a graph, and return the graph."""
    if not graph.has_node(parent_node_id):
        raise nx.exception.NodeNotFound

    _graph: nx.DiGraph = copy.deepcopy(graph)
    order = _get_next_child_order(_graph, parent_node_id)
    child_node_id = f"NODE_{name}_{uuid.uuid4()}"
    _graph.add_node(child_node_id, uuid=meta_uuid, name=name, order=order)
    _graph.add_edge(parent_node_id, child_node_id)
    return (_graph, child_node_id)


def _remove_nodes_from_graph(graph: nx.DiGraph, node_ids: list[str]) -> nx.DiGraph:
    """Remove a node from a graph, including its successors."""

    _graph: nx.DiGraph = copy.deepcopy(graph)
    nodes_to_remove = set()
    for node_id in node_ids:
        # dfs_preorder_nodes iterates over all nodes reachable from node_id.
        reachable_nodes = nx.dfs_preorder_nodes(_graph, node_id)
        nodes_to_remove.update(reachable_nodes)

    _graph.remove_nodes_from(nodes_to_remove)
    _graph = _renormalize_ordering(_graph)
    return _graph


def _reorder_nodes(graph: nx.DiGraph, node_id: str, new_index: int):
    """
    Reorder nodes in a graph.
    Algorithm:
        1. Set the node's `order` number to a temp value that is the new order plus a
        fractional value (-0.5 if the order is decreasing, +0.5 if it is increasing).
        2. Sort the nodes on their `order` value and re-set their order to the position
        in this sorted set.

    Example: nodes are ordered [A, B, C, D] and we want to move A to position 3. The
    temp_index for A will be 3.5. The `order` values for the nodes are then:
        A->3.5
        B->1
        C->2
        D->3
    After sorting and enumerating:
        B->(index 0, `order` 1)
        C->(index 1, `order` 2)
        D->(index 2, `order` 3)
        A->(index 3, `order` 3.5)
    Resetting `order` to the enumerated index:
        B->0
        C->1
        D->2
        A->3
    """
    _graph: nx.DiGraph = copy.deepcopy(graph)

    parent = next(_graph.predecessors(node_id))
    old_index = graph.nodes[node_id]["order"]
    if new_index >= old_index:
        temp_index = new_index + 0.5
    else:
        temp_index = new_index - 0.5

    _graph.nodes[node_id]["order"] = temp_index
    sorted_siblings = sorted(
        _graph.successors(parent), key=lambda n: _graph.nodes[n]["order"]
    )
    for i, node in enumerate(sorted_siblings):
        _graph.nodes[node]["order"] = i

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
        # type Other projects have a "null" parent node above the project root, to
        # support multiple versions.
        project_graph.add_node(
            root_node_id, **{"uuid": None, "name": None, "projectType": "other"}
        )
        base_node_id = f"NODE_project_{uuid.uuid4()}"
        project_graph.add_node(base_node_id, **base_node_data)
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


def add_node_to_project(project_id: str, parent_node: str, meta_uuid: str, name: str):
    """Update the database entry for a project graph to add a node."""
    # Lock the project graph's tale row to prevent conflicting updates.
    with transaction.atomic():
        graph_model = ProjectMetadata.objects.select_for_update().get(
            name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
        )
        project_graph = nx.node_link_graph(graph_model.value)

        (updated_graph, new_node_id) = _add_node_to_graph(
            project_graph, parent_node, meta_uuid, name
        )

        graph_model.value = nx.node_link_data(updated_graph)
        graph_model.save()
    return new_node_id


def remove_nodes_from_project(project_id: str, node_ids: list[str]):
    """
    Update the database entry for the project graph to remove nodes.
    This method takes an array of node IDs because if we delete an entity, it may need
    to be removed simultaneously from multiple positions in the graph.
    """
    # Lock the project graph's tale row to prevent conflicting updates.
    with transaction.atomic():
        graph_model = ProjectMetadata.objects.select_for_update().get(
            name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
        )
        project_graph = nx.node_link_graph(graph_model.value)

        updated_graph = _remove_nodes_from_graph(project_graph, node_ids)

        graph_model.value = nx.node_link_data(updated_graph)
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

        graph_model.value = nx.node_link_data(updated_graph)
        graph_model.save()
