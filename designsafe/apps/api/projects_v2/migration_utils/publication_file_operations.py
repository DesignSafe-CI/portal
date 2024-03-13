"""Operations to format published data in accordance with the project structure"""

import shutil
import os
from pathlib import Path
from designsafe.apps.api.projects_v2.migration_utils.graph_constructor import (
    transform_pub_entities,
)


def format_publication_data(
    project_id,
    version=None,
    v1_pubs_root="/corral-repl/tacc/NHERI/published",
    v2_pubs_root="/corral-repl/tacc/NHERI/published-v2",
):
    """
    Format publication data in accordance with the project structure.
    Hard links are used for "copying" files in order to avoid duplicating them on disk.
    """
    pub_graph, path_mappings = transform_pub_entities(project_id, version)

    base_project = next(
        (
            node
            for node in pub_graph
            if pub_graph.nodes[node]["name"] == "designsafe.project"
        )
    )
    prj_value = pub_graph.nodes[base_project]

    if prj_value["value"]["projectType"] == "other":
        base_path = prj_value["basePath"]
        v1_full_path = Path(v1_pubs_root) / Path(project_id)
        v2_full_path = Path(v2_pubs_root) / Path(base_path.lstrip("/")) / "data"
        os.makedirs(str(v2_full_path.parent), exist_ok=True)
        shutil.copytree(v1_full_path, v2_full_path, dirs_exist_ok=True)
        return

    for mapping in path_mappings:
        for v1_path, v2_path in mapping.items():
            v1_full_path = (
                Path(v1_pubs_root) / Path(project_id) / Path(v1_path.lstrip("/"))
            )
            v2_full_path = Path(v2_pubs_root) / Path(v2_path.lstrip("/"))
            os.makedirs(str(v2_full_path.parent), exist_ok=True)
            if v1_full_path.is_dir():
                shutil.copytree(
                    v1_full_path,
                    v2_full_path,
                    dirs_exist_ok=True,
                )
            else:
                shutil.copy2(v1_full_path, v2_full_path)


def format_publication_data_symlink(
    project_id,
    version=None,
    v1_pubs_root="/corral-repl/tacc/NHERI/published",
    v2_pubs_root="/corral-repl/tacc/NHERI/published-v2",
):
    """
    Format publication data in accordance with the project structure.
    Hard links are used for "copying" files in order to avoid duplicating them on disk.
    """
    _, path_mappings = transform_pub_entities(project_id, version)

    for mapping in path_mappings:
        for v1_path, v2_path in mapping.items():
            v1_full_path = (
                Path(v1_pubs_root) / Path(project_id) / Path(v1_path.lstrip("/"))
            )
            v2_full_path = Path(v2_pubs_root) / Path(v2_path.lstrip("/"))
            os.makedirs(str(v2_full_path.parent), exist_ok=True)
            os.symlink(v1_full_path, v2_full_path)
