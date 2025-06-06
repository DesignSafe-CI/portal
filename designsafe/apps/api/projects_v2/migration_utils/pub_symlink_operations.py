"""Utilities for symlinking publication files to curation-informed paths"""

import os
from pathlib import Path
import networkx as nx
from django.conf import settings
from designsafe.apps.api.publications_v2.models import Publication
from designsafe.apps.api.projects_v2.operations.path_operations import (
    construct_entity_filepaths,
    construct_published_path_mappings,
    update_path_mappings,
)
from designsafe.apps.api.datafiles.models import PublicationSymlink

published_path = settings.DESIGNSAFE_PUBLISHED_PATH
dataset_path = settings.PUBLISHED_DATASET_PATH


class Workdir:
    """
    Context manager for changing the working directory. Used for constructing symlinks
    """

    def __init__(self, destination_dir):
        self.starting_dir = os.getcwd()
        self.destination_dir = destination_dir

    def __enter__(self):
        os.chdir(self.destination_dir)

    def __exit__(self, *args):
        os.chdir(self.starting_dir)


def construct_symlink_mapping(project_id: str):
    """Construct symlinks for publication files using the mapping to curation-informed path"""
    pub = Publication.objects.get(project_id=project_id)
    pub_tree: nx.DiGraph = nx.node_link_graph(pub.tree)
    basepath_tree = construct_entity_filepaths(
        pub_tree,
        dataset_root=settings.PUBLISHED_DATASET_PATH,
        strip_legacy_versions=True,
    )

    if pub_tree.nodes["NODE_ROOT"].get("uuid", None) is None:
        # We are in an Other type project that might not have discrete FileObjs
        # want symlink of form ../PRJ-1234 -> PRJ-1234/project--prj-name/data
        path_mappings = {}
        for dataset in basepath_tree.successors("NODE_ROOT"):
            project_path = f"/{project_id}"
            dest_path = f"{basepath_tree.nodes[dataset]['basePath']}/data".replace(
                "//", "/"
            )
            version = basepath_tree.nodes[dataset].get("version", 1)
            if version > 1:
                project_path = f"/{project_id}v{version}"
            path_mappings[dataset] = {project_path: dest_path}

    else:
        path_mappings = construct_published_path_mappings(basepath_tree)

    symlink_mapping = {}
    for mapping in path_mappings.values():
        for source in mapping:
            new_source = os.path.relpath(source, os.path.dirname(mapping[source]))
            new_dest = os.path.relpath(mapping[source], dataset_path)
            symlink_mapping[new_source] = symlink_mapping.get(new_source, []) + [
                new_dest
            ]

    return symlink_mapping


def generate_symlinks_from_mapping(mapping):
    """Use a mapping of source/target relative paths to construct symlinks."""
    published_dataset_path = (
        f"{published_path.rstrip('/')}/{settings.PUBLISHED_DATASET_PATH.lstrip('/')}"
    )

    with Workdir(published_dataset_path):
        for source in mapping:
            for dest in mapping[source]:
                parent_path = str(Path(dest).parent)
                try:
                    os.makedirs(parent_path, exist_ok=True)
                    os.symlink(source, dest)
                except FileExistsError:
                    # Continue here so that this method is idempotent.
                    continue


def migrate_publication_symlinks(project_id):
    """
    Construct symlinks for an existing publication.
    """

    symlink_mapping = construct_symlink_mapping(project_id)
    generate_symlinks_from_mapping(symlink_mapping)


def migrate_publication_metadata(project_id):
    """
    Update publication metadata to include curation-informed file paths.
    """
    pub = Publication.objects.get(project_id=project_id)
    pub_tree: nx.DiGraph = nx.node_link_graph(pub.tree)

    basepath_tree = construct_entity_filepaths(
        pub_tree,
        dataset_root=settings.PUBLISHED_DATASET_PATH,
        strip_legacy_versions=True,
    )
    updated_tree, _ = update_path_mappings(basepath_tree, legacy_other_pubs=True)

    pub.tree = nx.node_link_data(updated_tree)
    pub.save()


def create_symlink_db_records(project_id):
    """
    Create records for each symlink so we can determine whether they
    point to a file or a dir.
    """
    pub = Publication.objects.get(project_id=project_id)
    pub_tree: nx.DiGraph = nx.node_link_graph(pub.tree)
    basepath_tree = construct_entity_filepaths(
        pub_tree,
        dataset_root=settings.PUBLISHED_DATASET_PATH,
        strip_legacy_versions=True,
    )
    updated_tree, _ = update_path_mappings(basepath_tree, legacy_other_pubs=True)
    # Add database records for symlinks so their types can be recovered
    for node in updated_tree.nodes:
        file_objs = updated_tree.nodes[node].get("value", {}).get("fileObjs", [])
        for fo in file_objs:
            accessor = f"tapis://{settings.PUBLISHED_SYSTEM}/{fo['path'].lstrip('/')}"
            _type = fo["type"]
            PublicationSymlink.objects.update_or_create(
                tapis_accessor=accessor, type=_type
            )
