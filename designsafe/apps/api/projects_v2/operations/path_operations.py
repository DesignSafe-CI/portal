"""Operations for updating file and tag paths so that the entity relations are represented
in the directory structure. UNUSED for now, pending stakeholder approval.
"""

from typing import Optional
from pathlib import Path
import networkx as nx
from django.utils.text import slugify
from designsafe.apps.api.projects_v2.schema_models import PATH_SLUGS


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
