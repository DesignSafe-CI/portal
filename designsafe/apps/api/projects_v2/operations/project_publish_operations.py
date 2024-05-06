"""Utils for generating published metadata"""

from typing import Optional, Literal
from pathlib import Path
import logging
import networkx as nx
from django.utils.text import slugify
from designsafe.apps.api.projects_v2.schema_models import PATH_SLUGS
from designsafe.apps.api.projects_v2 import constants

from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata

logger = logging.getLogger(__name__)

REQUIRED_ENTITIES = {
    constants.EXPERIMENT: [
        constants.EXPERIMENT_MODEL_CONFIG,
        constants.EXPERIMENT_SENSOR,
        constants.EXPERIMENT_EVENT,
    ],
    constants.SIMULATION: [
        constants.SIMULATION_MODEL,
        constants.SIMULATION_INPUT,
        constants.SIMULATION_OUTPUT,
        constants.SIMULATION_REPORT,
    ],
    constants.FIELD_RECON_MISSION: [
        constants.FIELD_RECON_SOCIAL_SCIENCE,
        constants.FIELD_RECON_GEOSCIENCE,
        constants.FIELD_RECON_PLANNING,
    ],
    constants.HYBRID_SIM: [
        constants.HYBRID_SIM_GLOBAL_MODEL,
        constants.HYBRID_SIM_COORDINATOR,
        constants.HYBRID_SIM_SIM_SUBSTRUCTURE,
        constants.HYBRID_SIM_EXP_SUBSTRUCTURE,
    ],
}


def check_missing_entities(
    project_id: str, entity_uuid: str, default_operator: Literal["AND", "OR"] = "AND"
):
    """Validate an entity's tree structure to check for missing requirements.
    The default_operator argument determines whether to check exhaustively for each
    required entity, or whether only 1 entity in the array is required
    (e.g. field recon missions require a planning, social science, OR geoscience colleciton but not all 3)
    """

    project_tree = ProjectMetadata.get_project_by_id(project_id)
    project_graph: nx.DiGraph = nx.node_link_graph(project_tree.project_graph.value)

    entity_node = next(
        (
            node
            for node in project_graph.nodes
            if project_graph.nodes[node]["uuid"] == entity_uuid
        ),
        None,
    )
    entity_name = project_graph.nodes[entity_node]["name"]

    child_nodes = [
        project_graph.nodes[node]
        for node in nx.dfs_preorder_nodes(project_graph, entity_node)
    ]
    missing_entities = []

    for required_entity_name in REQUIRED_ENTITIES.get(entity_name, []):
        has_required_entity = next(
            (node for node in child_nodes if node["name"] == required_entity_name),
            None,
        )
        if not has_required_entity:
            missing_entities.append(required_entity_name)

    if default_operator == "OR" and len(missing_entities) < len(
        REQUIRED_ENTITIES[entity_name]
    ):
        # At least one of the required entity types is associated
        missing_entities = []

    return missing_entities


def validate_entity_selection(project_id: str, entity_uuids: list[str]):
    """Check for missing requirements in a selection of entity UUIDs."""
    validation_errors = []
    for uuid in entity_uuids:
        entity_meta = ProjectMetadata.objects.get(uuid=uuid)
        match entity_meta.name:
            case constants.EXPERIMENT | constants.SIMULATION | constants.HYBRID_SIM:
                missing_entities = check_missing_entities(project_id, uuid)
                if len(missing_entities) > 0:
                    validation_errors.append(
                        {
                            "errorType": "MISSING_ENTITY",
                            "name": entity_meta.name,
                            "title": entity_meta.value["title"],
                            "missing": missing_entities,
                        }
                    )
            case constants.FIELD_RECON_MISSION:
                missing_entities = check_missing_entities(
                    project_id, uuid, default_operator="OR"
                )
                if len(missing_entities) > 0:
                    validation_errors.append(
                        {
                            "errorType": "MISSING_ENTITY",
                            "name": entity_meta.name,
                            "title": entity_meta.value["title"],
                            "missing": missing_entities,
                        }
                    )
    return validation_errors


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


def map_project_paths_to_published(
    file_objs: list[dict], base_path: str
) -> dict[str, str]:
    """Construct a mapping of project paths to paths in the published archive."""
    path_mapping = {}
    duplicate_counts = {}
    for file_obj in file_objs:
        pub_path = str(Path(base_path) / Path(file_obj["path"]).name)
        if pub_path in path_mapping.values():
            duplicate_counts[pub_path] = duplicate_counts.get(pub_path, 0) + 1
            # splice dupe count into name, e.g. "myfile(1).txt"
            [base_name, *ext] = Path(pub_path).name.split(".", 1)
            deduped_name = f"{base_name}({duplicate_counts[pub_path]})"
            pub_path = str(Path(base_path) / ".".join([deduped_name, *ext]))

        path_mapping[file_obj["path"]] = pub_path

    return path_mapping


def construct_published_path_mappings(
    pub_graph: nx.DiGraph,
) -> dict[str, dict[str, str]]:
    """
    For each node in the publication graph, get the mapping of file paths in the
    PROJECT system to file paths in the PUBLICATION system. Returns a dict of form:
    {"NODE_ID": {"PROJECT_PATH": "PUBLICATION_PATH"}}
    """
    path_mappings = {}
    for node in pub_graph:
        node_data = pub_graph.nodes[node]
        if not node_data.get("value"):
            continue
        path_mapping = map_project_paths_to_published(
            node_data["value"].get("fileObjs", []), node_data["basePath"]
        )
        path_mappings[node] = path_mapping
    return path_mappings


def update_path_mappings(pub_graph: nx.DiGraph):
    """update fileObjs and fileTags to point to published paths."""
    pub_mapping = construct_published_path_mappings(pub_graph)
    for node in pub_graph:
        node_data = pub_graph.nodes[node]
        if (
            node not in pub_mapping
            or not node_data.get("value")
            or not node_data["value"].get("fileObjs")
        ):
            continue
        path_mapping = pub_mapping[node]
        new_file_objs = [
            {
                **file_obj,
                "path": path_mapping[file_obj["path"]],
                "system": "designsafe.storage.published",
            }
            for file_obj in node_data["value"].get("fileObjs", [])
        ]
        node_data["value"]["fileObjs"] = new_file_objs

        # Update file tags. If the path mapping contains:
        #   {"/path/to/dir1": "/entity1/dir1"}
        # and the tags contain:
        #   {"path": "/path/to/dir1/file1", "tagName": "my_tag"}
        # then we need to construct the file tag:
        #   {"path": "/entity1/dir1/file1", "tagName": "my_tag"}
        file_tags = node_data["value"].get("fileTags", [])
        updated_tags = []
        for tag in file_tags:
            if not tag.get("path", None):
                # If there is no path, we can't recover the tag.
                continue
            tag_path_prefixes = [p for p in path_mapping if tag["path"].startswith(p)]

            for prefix in tag_path_prefixes:
                updated_tags.append(
                    {
                        **tag,
                        "path": tag["path"].replace(prefix, path_mapping[prefix], 1),
                    }
                )
        node_data["value"]["fileTags"] = updated_tags

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
        # Relabel nodes to prevent duplicate node IDs when versioning.
        subtree = nx.relabel_nodes(
            subtree,
            {node: f"{node}_V{version}" for node in subtree if node != "NODE_ROOT"},
        )

    subtree = construct_entity_filepaths(subtree, version)
    subtree = update_path_mappings(subtree)
    return subtree
