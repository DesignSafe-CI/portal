"""Utils for generating published metadata"""

from typing import Optional
from pathlib import Path
import logging
import networkx as nx
from django.utils.text import slugify
from designsafe.apps.api.projects_v2.schema_models import PATH_SLUGS

from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata

logger = logging.getLogger(__name__)


def add_values_to_tree(project_id: str) -> nx.DiGraph:
    """
    Create a copy of the publication tree that includes up-to-date metadata
    for each entity. Used to create a preview of the published metadata, and as a base
    to create subtrees for individual publications (experiments/reports/etc).

    NOTE: When amend/versioning, need to adjust order attribute on ALL direct children
    of the project root. otherwise could get duplicate order keys.
    """
    project_meta = ProjectMetadata.get_project_by_id(project_id)
    prj_entities = ProjectMetadata.get_entities_by_project_id(project_id)
    entity_map = {entity.uuid: entity for entity in prj_entities}

    publication_tree: nx.DiGraph = nx.node_link_graph(project_meta.project_graph.value)
    for node_id in publication_tree:
        uuid = publication_tree.nodes[node_id]["uuid"]
        if uuid is not None:
            publication_tree.nodes[node_id]["value"] = entity_map[uuid].value

    return publication_tree


def construct_entity_filepaths(pub_graph: nx.DiGraph, version: Optional[int] = None):
    """
    Walk the publication graph and construct base file paths for each node.
    The file path for a node contains the titles of each entity above it in the
    hierarchy. Returns the publication graph with basePath data added for each node.
    """
    for parent_node, child_node in nx.bfs_edges(pub_graph, "NODE_ROOT"):
        # Construct paths based on the entity hierarchy
        parent_base_path = pub_graph.nodes[parent_node]["basePath"]
        entity_name_slug = PATH_SLUGS.get(pub_graph.nodes[child_node]["name"])
        entity_title = pub_graph.nodes[child_node]["value"]["title"]

        entity_dirname = f"{entity_name_slug}--{slugify(entity_title)}"

        if version and version > 1 and child_node in pub_graph.successors("NODE_ROOT"):
            # Version datasets if the containing publication is versioned.
            child_path = Path(parent_base_path) / f"{entity_dirname}--v{version}"
        elif parent_node in pub_graph.successors("NODE_ROOT"):
            # Publishable entities have a "data" folder in Bagit ontology.
            child_path = Path(parent_base_path) / "data" / entity_dirname
        else:
            child_path = Path(parent_base_path) / entity_dirname

        pub_graph.nodes[child_node]["basePath"] = str(child_path)
    return pub_graph


def get_publication_subtree(
    project_id: str, entity_uuid: str, version: Optional[int] = None
) -> tuple[str, nx.DiGraph]:
    """
    Obtain the subtree for a single publishable entity (experiment/simulation/etc) and
    add version information if relevant.
    """
    tree_with_values = add_values_to_tree(project_id)
    pub_root = next(
        (
            node_id
            for node_id in tree_with_values.successors("NODE_ROOT")
            if tree_with_values.nodes[node_id]["uuid"] == entity_uuid
        ),
        None,
    )
    if not pub_root:
        raise ValueError("No entity found with specified UUID")
    subtree: nx.DiGraph = tree_with_values.subgraph(
        nx.bfs_tree(tree_with_values, pub_root).nodes
    ).copy()

    subtree.nodes[pub_root]["version"] = version or 1

    subtree.add_node(
        "NODE_ROOT", basePath=f"/{project_id}", **tree_with_values.nodes["NODE_ROOT"]
    )
    subtree.add_edge("NODE_ROOT", pub_root)
    if version and version > 1:
        # Relabel the entity root node to prevent duplicate node IDs when versioning.
        subtree = nx.relabel_nodes(subtree, {pub_root: f"{pub_root}_V{version}"})

    subtree = construct_entity_filepaths(subtree, version)
    return subtree
