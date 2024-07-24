"""Utils for generating published metadata"""

from typing import Optional, Literal
import subprocess
import os
import shutil
import datetime
from pathlib import Path
import logging
from django.conf import settings
import networkx as nx
from celery import shared_task
from designsafe.apps.api.projects_v2 import constants

from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata
from designsafe.apps.api.projects_v2.operations.datacite_operations import (
    get_datacite_json,
    publish_datacite_doi,
    upsert_datacite_json,
)
from designsafe.apps.api.projects_v2.operations.project_archive_operations import (
    archive_publication_async,
)
from designsafe.apps.api.publications_v2.models import Publication
from designsafe.apps.api.publications_v2.elasticsearch import index_publication
from designsafe.apps.data.tasks import agave_indexer

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
    constants.FIELD_RECON_REPORT: [],
}

ENTITIES_WITH_REQUIRED_FILES = [
    constants.EXPERIMENT_MODEL_CONFIG,
    constants.EXPERIMENT_SENSOR,
    constants.EXPERIMENT_EVENT,
    constants.SIMULATION_MODEL,
    constants.SIMULATION_INPUT,
    constants.SIMULATION_OUTPUT,
    constants.SIMULATION_REPORT,
    constants.FIELD_RECON_SOCIAL_SCIENCE,
    constants.FIELD_RECON_GEOSCIENCE,
    constants.FIELD_RECON_PLANNING,
    constants.HYBRID_SIM_GLOBAL_MODEL,
    constants.HYBRID_SIM_COORDINATOR,
    constants.HYBRID_SIM_SIM_SUBSTRUCTURE,
    constants.HYBRID_SIM_EXP_SUBSTRUCTURE,
    constants.HYBRID_SIM_COORDINATOR_OUTPUT,
    constants.HYBRID_SIM_EXP_OUTPUT,
    constants.HYBRID_SIM_SIM_OUTPUT,
    constants.FIELD_RECON_REPORT,
    constants.HYBRID_SIM_REPORT,
    constants.HYBRID_SIM_ANALYSIS,
]


def check_missing_entities(
    project_id: str, entity_uuid: str, default_operator: Literal["AND", "OR"] = "AND"
):
    """Validate an entity's tree structure to check for missing requirements.
    The default_operator argument determines whether to check exhaustively for each
    required entity, or whether only 1 entity in the array is required
    (e.g. field recon missions require a planning, social science, OR geoscience colleciton but not all 3)
    """

    project_graph: nx.DiGraph = add_values_to_tree(project_id)

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
    logger.debug(child_nodes)
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

    # Check for entities with missing files:
    missing_file_objs = []
    for child_node in child_nodes:
        if child_node["name"] in ENTITIES_WITH_REQUIRED_FILES and not child_node[
            "value"
        ].get("fileObjs", []):
            missing_file_objs.append(
                {"name": child_node["name"], "title": child_node["value"]["title"]}
            )

    return missing_entities, missing_file_objs


def validate_entity_selection(project_id: str, entity_uuids: list[str]):
    """Check for missing requirements in a selection of entity UUIDs."""
    validation_errors = []
    for uuid in entity_uuids:
        entity_meta = ProjectMetadata.objects.get(uuid=uuid)
        match entity_meta.name:
            case constants.EXPERIMENT | constants.SIMULATION | constants.HYBRID_SIM:
                missing_entities, missing_file_objs = check_missing_entities(
                    project_id, uuid
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
                for missing_file_obj in missing_file_objs:
                    validation_errors.append(
                        {
                            "errorType": "MISSING_FILES",
                            "name": missing_file_obj["name"],
                            "title": missing_file_obj["title"],
                        }
                    )

            case constants.FIELD_RECON_MISSION | constants.FIELD_RECON_REPORT:
                missing_entities, missing_file_objs = check_missing_entities(
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
                for missing_file_obj in missing_file_objs:
                    validation_errors.append(
                        {
                            "errorType": "MISSING_FILES",
                            "name": missing_file_obj["name"],
                            "title": missing_file_obj["title"],
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


def update_path_mappings(pub_graph: nx.DiGraph, project_uuid: str):
    """update fileObjs and fileTags to point to published paths."""
    path_mapping = {}
    for node in pub_graph:
        if node == "NODE_ROOT":
            continue
        node_data = pub_graph.nodes[node]
        new_file_objs = []
        for file_obj in node_data["value"].get("fileObjs", []):
            pub_path = str(
                Path(settings.DESIGNSAFE_PUBLISHED_PATH)
                / Path(node_data["basePath"].lstrip("/"))
                / Path(file_obj["path"].lstrip("/"))
            )
            project_path = str(
                Path(settings.DESIGNSAFE_PROJECTS_PATH)
                / Path(project_uuid)
                / Path(file_obj["path"].lstrip("/"))
            )
            path_mapping[project_path] = pub_path

            new_file_objs.append(
                {
                    **file_obj,
                    "path": str(
                        Path(node_data["basePath"]) / Path(file_obj["path"].lstrip("/"))
                    ),
                    "system": "designsafe.storage.published",
                }
            )

        if new_file_objs:
            node_data["value"]["fileObjs"] = new_file_objs

        updated_tags = [
            {
                **file_tag,
                "path": str(
                    Path(node_data["basePath"]) / Path(file_tag["path"].lstrip("/"))
                ),
            }
            for file_tag in node_data["value"].get("fileTags", [])
            if file_tag.get("path", None)
        ]
        if updated_tags:
            node_data["value"]["fileTags"] = updated_tags

    return pub_graph, path_mapping


def get_publication_subtree(
    project_id: str,
    entity_uuid: str,
    version: Optional[int] = None,
    version_info: Optional[int] = None,
) -> tuple[str, nx.DiGraph]:
    """
    Obtain the subtree for a single publishable entity (experiment/simulation/etc) and
    add version information if relevant. The subtree includes the root node and any
    nodes associated with the UUID.
    """
    project_uuid = ProjectMetadata.get_project_by_id(project_id).uuid
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
    subtree.nodes[pub_root]["status"] = "published"
    subtree.nodes[pub_root]["publicationDate"] = datetime.datetime.now(
        datetime.UTC
    ).isoformat()
    base_pub_path = f"/{project_id}"
    if version and version > 1:
        subtree.nodes[pub_root]["versionDate"] = datetime.datetime.now(
            datetime.UTC
        ).isoformat()
        subtree.nodes[pub_root]["versionInfo"] = version_info or ""
        base_pub_path += f"v{version}"

    subtree.add_node(
        "NODE_ROOT", basePath=base_pub_path, **tree_with_values.nodes["NODE_ROOT"]
    )
    subtree.add_edge("NODE_ROOT", pub_root)
    if version and version > 1:
        # Relabel nodes to prevent duplicate node IDs when versioning.
        subtree = nx.relabel_nodes(
            subtree,
            {node: f"{node}_V{version}" for node in subtree if node != "NODE_ROOT"},
        )

    for node in subtree.nodes:
        subtree.nodes[node]["basePath"] = base_pub_path
    subtree, path_mapping = update_path_mappings(subtree, project_uuid)
    return subtree, path_mapping


def fix_publication_dates(existing_tree: nx.DiGraph, incoming_tree: nx.DiGraph):
    """
    Update publication date on versioned pubs to match the initial publication date.
    """
    initial_pub_dates = {}
    for published_entity in existing_tree.successors("NODE_ROOT"):
        published_uuid = existing_tree.nodes[published_entity]["uuid"]
        initial_pub_dates[published_uuid] = existing_tree.nodes[published_entity][
            "publicationDate"
        ]
    for node in incoming_tree:
        if incoming_tree.nodes[node]["uuid"] in initial_pub_dates:
            incoming_tree.nodes[node]["publicationDate"] = initial_pub_dates[
                incoming_tree.nodes[node]["uuid"]
            ]

    return incoming_tree


def get_publication_full_tree(
    project_id: str,
    entity_uuids: list[str],
    version: Optional[int] = None,
    version_info: Optional[str] = None,
):
    """Combine subtrees to create the full publishable metadata object."""
    full_path_mapping = {}
    subtrees = []
    for uuid in entity_uuids:
        subtree, path_mapping = get_publication_subtree(
            project_id, uuid, version=version, version_info=version_info
        )
        subtrees.append(subtree)
        full_path_mapping = {**full_path_mapping, **path_mapping}

    full_tree = nx.compose_all(subtrees)

    if version and version > 1:
        existing_pub = Publication.objects.get(project_id=project_id)
        published_tree: nx.DiGraph = nx.node_link_graph(existing_pub.tree)

        # Update publication date on versioned pubs to match the initial publication date.
        full_tree = fix_publication_dates(published_tree, full_tree)
        full_tree = nx.compose(published_tree, full_tree)

    return full_tree, full_path_mapping


class ProjectFileNotFound(Exception):
    """exception raised when attempting to copy a non-existent file for publication"""


def copy_publication_files(
    path_mapping: dict, project_id: str, version: Optional[int] = None
):
    """
    Copy files from My Projects to the published area on Corral.
    `path_mapping` is a dict mapping project paths to their corresponding paths in the
    published area.
    """
    os.chmod("/corral-repl/tacc/NHERI/published", 0o755)
    try:
        pub_dirname = project_id
        if version and version > 1:
            pub_dirname = f"{project_id}v{version}"

        pub_root_dir = str(Path(f"{settings.DESIGNSAFE_PUBLISHED_PATH}") / pub_dirname)
        os.makedirs(pub_root_dir, exist_ok=True)

        for src_path in path_mapping:
            src_path_obj = Path(src_path)
            if not src_path_obj.exists():
                raise ProjectFileNotFound(f"File not found: {src_path}")

            dest_path_obj = Path(path_mapping[src_path])
            os.makedirs(dest_path_obj.parent, exist_ok=True)

            if src_path_obj.is_dir():
                shutil.copytree(
                    src_path,
                    path_mapping[src_path],
                    dirs_exist_ok=True,
                    copy_function=shutil.copy,
                )
            else:
                shutil.copy(src_path, path_mapping[src_path])

        # Lock the publication directory so that non-root users can only read files and list directories
        subprocess.run(["chmod", "-R", "a-x,a=rX", pub_root_dir], check=True)
        agave_indexer.apply_async(
            kwargs={
                "systemId": "designsafe.storage.published",
                "filePath": pub_dirname,
                "recurse": True,
            },
            queue="indexing",
        )
    finally:
        os.chmod("/corral-repl/tacc/NHERI/published", 0o555)


# pylint: disable=too-many-locals, too-many-branches, too-many-statements
def publish_project(
    project_id: str,
    entity_uuids: list[str],
    version: Optional[int] = 1,
    version_info: Optional[str] = None,
    dry_run: bool = False,
):
    """
    Publish a project. The following steps occur during publication:
    - Create a published metadata record for the project and its entities
    - Generate a doi for each published entity in draft form
    - Transfer published files to the Published area on Corral.
    - Publish the DOI to make it world-readable.
    (todo)
    - ZIP publication files and metadata
    - upload metadata/manifest to Fedora repo
    """

    pub_tree, path_mapping = get_publication_full_tree(
        project_id, entity_uuids, version=version, version_info=version_info
    )
    if dry_run:
        return pub_tree, path_mapping

    if not settings.DEBUG:
        # Copy files first so if it fails we don't create orphan metadata/datacite entries.
        copy_publication_files(path_mapping, project_id, version=version)

    new_dois = []

    for entity_uuid in entity_uuids:
        entity_meta = ProjectMetadata.objects.get(uuid=entity_uuid)
        existing_dois = entity_meta.value.get("dois", [])
        existing_doi = next(iter(existing_dois), None)

        datacite_json = get_datacite_json(pub_tree, entity_uuid, version)
        datacite_resp = upsert_datacite_json(datacite_json, doi=existing_doi)
        doi = datacite_resp["data"]["id"]
        new_dois.append(doi)

        entity_meta.value["dois"] = [doi]
        entity_meta.save()

        entity_nodes = [
            node
            for node in pub_tree.nodes
            if pub_tree.nodes[node]["uuid"] == entity_uuid
        ]
        for node in entity_nodes:
            pub_tree.nodes[node]["value"]["dois"] = [doi]

    if not settings.DEBUG:
        for doi in new_dois:
            publish_datacite_doi(doi)

    base_meta_node = next(
        (
            node
            for node in pub_tree.nodes
            if pub_tree.nodes[node]["name"] == constants.PROJECT
            and pub_tree.nodes[node].get("version", version) == version
        )
    )
    base_meta_value = pub_tree.nodes[base_meta_node]["value"]

    pub_metadata, _ = Publication.objects.update_or_create(
        project_id=project_id,
        defaults={"value": base_meta_value, "tree": nx.node_link_data(pub_tree)},
    )
    pub_metadata.save()

    index_publication(project_id)
    if not settings.DEBUG:
        archive_publication_async.apply_async(
            args=[project_id, version], queue="default"
        )

    return pub_metadata


@shared_task
def publish_project_async(
    project_id: str,
    entity_uuids: list[str],
    version: Optional[int] = 1,
    version_info: Optional[str] = None,
    dry_run: bool = False,
):
    """Async wrapper arount publication"""
    publish_project(project_id, entity_uuids, version, version_info, dry_run)


def amend_publication(project_id: str):
    """
    Update metadata values in a publication to match the latest changes made in the
    underlying project. Does NOT affect file associations or tags.
    """

    pub_root = Publication.objects.get(project_id=project_id)
    pub_tree: nx.DiGraph = nx.node_link_graph(pub_root.tree)
    latest_version = max(
        pub_tree.nodes[node]["version"] for node in pub_tree.successors("NODE_ROOT")
    )
    pubs_to_amend = [
        node
        for node in pub_tree.successors("NODE_ROOT")
        if pub_tree.nodes[node]["version"] == latest_version
    ]

    for pub_node in pubs_to_amend:
        for node in nx.dfs_preorder_nodes(pub_tree, pub_node):
            uuid = pub_tree.nodes[node]["uuid"]
            published_meta_value = pub_tree.nodes[node]["value"]
            try:
                prj_meta_value = ProjectMetadata.objects.get(uuid=uuid).value
                prj_meta_value.pop("fileObjs", None)
                prj_meta_value.pop("fileTags", None)
                amended_meta_value = {**published_meta_value, **prj_meta_value}
                pub_tree.nodes[node]["value"] = amended_meta_value
            except ProjectMetadata.DoesNotExist:
                continue

    base_prj_meta_value = ProjectMetadata.get_project_by_id(project_id).value
    base_prj_meta_value.pop("fileObjs", None)
    base_prj_meta_value.pop("fileTags", None)

    # If not type Other, we also amend the NODE_ROOT metadata.
    if pub_tree.nodes["NODE_ROOT"].get("uuid", None):
        base_published_meta_value = pub_tree.nodes["NODE_ROOT"]["value"]
        amended_root_meta_value = {**base_published_meta_value, **base_prj_meta_value}
        pub_tree.nodes["NODE_ROOT"]["value"] = amended_root_meta_value

    pub_root.tree = nx.node_link_data(pub_tree)
    pub_root.value = {**pub_root.value, **base_prj_meta_value}
    pub_root.save()

    # Update datacite metadata
    for node in pubs_to_amend:
        datacite_json = get_datacite_json(
            pub_tree, pub_tree.nodes[node]["uuid"], latest_version
        )
        upsert_datacite_json(
            datacite_json, doi=pub_tree.nodes[node]["value"]["dois"][0]
        )

    # Index publication in Elasticsearch
    index_publication(project_id)


@shared_task
def amend_publication_async(project_id: str):
    """async wrapper around amend_publication"""
    amend_publication(project_id)
