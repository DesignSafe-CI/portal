"""Operations for updating file and tag paths so that the entity relations are represented
in the directory structure. UNUSED for now, pending stakeholder approval.
"""

from typing import Optional
import copy
from pathlib import Path
import subprocess
import logging
import networkx as nx
from celery import shared_task
from django.utils.text import slugify
from django.conf import settings
from designsafe.libs.common.context_managers import Workdir, AsyncTaskContext
from designsafe.apps.api.publications_v2.models import Publication
from designsafe.apps.api.projects_v2.schema_models import PATH_SLUGS

logger = logging.getLogger(__name__)


def construct_entity_filepaths(
    pub_graph: nx.DiGraph,
    version: Optional[int] = None,
    dataset_root=None,
    strip_legacy_versions=False,
):
    """
    Walk the publication graph and construct base file paths for each node.
    The file path for a node contains the titles of each entity above it in the
    hierarchy. Returns the publication graph with basePath data added for each node.
    """
    _pub_graph = copy.deepcopy(pub_graph)

    # Need this for publications that currently have a version in the basePath
    if strip_legacy_versions:
        _pub_graph.nodes["NODE_ROOT"]["basePath"] = _pub_graph.nodes["NODE_ROOT"][
            "basePath"
        ].split("v")[0]

    # Datasets might need to specify a base path relative to the root of the published system
    # This should only be an issue for the initial migration to entity-based filepaths.
    if dataset_root:
        _pub_graph.nodes["NODE_ROOT"]["basePath"] = (
            f"{dataset_root}/{_pub_graph.nodes['NODE_ROOT']['basePath']}".replace(
                "//", "/"
            )
        )

    for parent_node, child_node in nx.bfs_edges(_pub_graph, "NODE_ROOT"):
        # Construct paths based on the entity hierarchy
        parent_base_path = _pub_graph.nodes[parent_node]["basePath"]
        entity_name_slug = PATH_SLUGS.get(_pub_graph.nodes[child_node]["name"])
        entity_title = _pub_graph.nodes[child_node]["value"]["title"]

        entity_dirname = f"{entity_name_slug}--{slugify(entity_title)}"

        if _pub_graph.nodes[child_node].get(
            "version", 1
        ) > 1 and child_node in _pub_graph.successors("NODE_ROOT"):
            # Version datasets if the containing publication is versioned.
            version = _pub_graph.nodes[child_node]["version"]
            child_path = Path(parent_base_path) / f"{entity_dirname}--V{version}"
        elif parent_node in _pub_graph.successors("NODE_ROOT"):
            # Publishable entities have a "data" folder in Bagit ontology.
            child_path = Path(parent_base_path) / "data" / entity_dirname
        else:
            child_path = Path(parent_base_path) / entity_dirname

        _pub_graph.nodes[child_node]["basePath"] = str(child_path)
    return _pub_graph


def map_project_paths_to_published(
    file_objs: list[dict], base_path: str
) -> dict[str, str]:
    """Construct a mapping of project paths to paths in the published archive."""
    path_mapping = {}
    duplicate_counts = {}
    for file_obj in file_objs:
        pub_path = str(Path(base_path) / "data" / Path(file_obj["path"]).name)
        if pub_path in path_mapping.values():
            duplicate_counts[pub_path] = duplicate_counts.get(pub_path, 0) + 1
            # splice dupe count into name, e.g. "myfile(1).txt"
            [base_name, *ext] = Path(pub_path).name.split(".", 1)
            deduped_name = f"{base_name}({duplicate_counts[pub_path]})"
            pub_path = str(Path(base_path) / "data" / ".".join([deduped_name, *ext]))

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


def update_path_mappings(pub_graph: nx.DiGraph, legacy_other_pubs=False):
    """update fileObjs and fileTags to point to published paths."""
    _pub_graph = copy.deepcopy(pub_graph)
    pub_mapping = construct_published_path_mappings(_pub_graph)
    for node in _pub_graph:
        node_data = _pub_graph.nodes[node]
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
                "legacyPath": file_obj["path"],
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
            # Files inside of associated folders can have tags, so need to check prefix.
            tag_path_prefixes = [p for p in path_mapping if tag["path"].startswith(p)]

            for prefix in tag_path_prefixes:
                updated_tags.append(
                    {
                        **tag,
                        "path": tag["path"].replace(prefix, path_mapping[prefix], 1),
                    }
                )
        node_data["value"]["fileTags"] = updated_tags

    # update file tags for Other/old FR pubs that don't have fileObjs
    if legacy_other_pubs:
        for node in _pub_graph:
            node_data = _pub_graph.nodes[node]
            if node_data.get("value", {}).get("projectType", None) in [
                "other",
                "field_reconnaissance",
            ]:
                tags = node_data["value"].get("fileTags", [])
                updated_tags = []
                version = node_data.get("version", 1)
                base_data_path = f"{node_data['basePath']}/data"
                tag_path_prefix = f'/{node_data["value"]["projectId"]}'
                if version:
                    tag_path_prefix = f'/{node_data["value"]["projectId"]}v{version}'
                for tag in tags:
                    updated_tags.append(
                        {
                            **tag,
                            "path": tag["path"].replace(
                                tag_path_prefix, base_data_path
                            ),
                        }
                    )
                node_data["value"]["fileTags"] = updated_tags

    return _pub_graph, pub_mapping


def generate_sha512_manifest(base_path: str, data_dir: str = "data"):
    """
    Create a BagIt-compatible sha512 manifest file for a directory.

    The equivalent shell command is:
    ```
    cd base_path && find data -type f -print0 | xargs -0 sha512sum > manifest-sha512.txt
    ```

    :param base_path: The path to the dir that should contain the manifest file.
    :type base_path: str
    :param data_dir: The path (relative to base_path) that contains the files to checksum.
    :type data_dir: str
    """
    with Workdir(base_path):
        with open("manifest-sha512.txt", "w", encoding="utf-8") as f:
            args = ["find", "-L", data_dir, "-type", "f", "-print0"]
            with subprocess.Popen(args, stdout=subprocess.PIPE) as p1:
                subprocess.check_call(
                    ["xargs", "-0", "sha512sum"], stdin=p1.stdout, stdout=f
                )


def generate_manifests_for_project(project_id: str):
    """
    Generate a sha512 manifest for each published collection within a project.

    :param project_id: Project ID
    :type project_id: str
    """
    logger.debug("Generating manifests for publication %s", project_id)
    paths_to_archive = []
    with AsyncTaskContext():
        pub_meta = Publication.objects.get(project_id=project_id)
        pub_tree: nx.DiGraph = nx.node_link_graph(pub_meta.tree)
        for published_node in pub_tree.successors("NODE_ROOT"):
            base_path = pub_tree.nodes[published_node]["basePath"]
            archive_path = str(
                Path(settings.DESIGNSAFE_PUBLISHED_PATH) / base_path.lstrip("/")
            )
            paths_to_archive.append(archive_path)

    for path in paths_to_archive:
        try:
            logger.debug("Generating manifest for path %s", path)
            generate_sha512_manifest(path)
        except (
            subprocess.CalledProcessError,
            subprocess.SubprocessError,
            FileNotFoundError,
        ) as exc:
            logger.debug("Failed to generate manifest at %s", path)
            raise exc
    logger.debug("Finished generating manifests for publication %s", project_id)


@shared_task
def generate_manifests_for_project_async(project_id: str):
    """
    Async wrapper around ```generate_manifests_for_project```

    :param project_id: Project ID
    :type project_id: str
    """
    generate_manifests_for_project(project_id)
