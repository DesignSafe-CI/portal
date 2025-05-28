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
        pub_tree, dataset_root=settings.PUBLISHED_DATASET_PATH
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
            new_source = os.path.relpath(source, dataset_path)
            new_dest = os.path.relpath(mapping[source], dataset_path)
            symlink_mapping[new_source] = new_dest

    return symlink_mapping


def generate_symlinks_from_mapping(mapping):
    """Use a mapping of source/target relative paths to construct symlinks."""
    published_dataset_path = (
        f"{published_path.rstrip('/')}/{settings.PUBLISHED_DATASET_PATH.lstrip('/')}"
    )

    with Workdir(published_dataset_path):
        for source in mapping:
            parent_path = str(Path(mapping[source]).parent)
            os.makedirs(parent_path, exist_ok=True)
            os.symlink(source, mapping[source])


def migrate_publication(project_id):
    pub = Publication.objects.get(project_id=project_id)
    pub_tree: nx.DiGraph = nx.node_link_graph(pub.tree)

    symlink_mapping = construct_symlink_mapping(project_id)
    # generate_symlinks_from_mapping(project_id)

    basepath_tree = construct_entity_filepaths(
        pub_tree, dataset_root=settings.PUBLISHED_DATASET_PATH
    )
    updated_tree = update_path_mappings(basepath_tree)
    pub.tree = nx.node_link_data(updated_tree)
    print(pub.tree)
    return pub.tree
    # pub.save()
