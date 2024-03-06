"""Tests for operations to convert metadata for publication"""

import pytest
import networkx as nx
from django import db
from designsafe.apps.api.projects_v2 import constants
from designsafe.apps.api.projects_v2.operations.project_meta_operations import (
    create_project_metdata,
    create_entity_metadata,
    add_file_associations,
    remove_file_associations,
    add_file_tags,
    set_file_tags,
    remove_file_tags,
    ProjectMetadata,
    FileObj,
    FileTag,
)
from designsafe.apps.api.projects_v2.operations.graph_operations import (
    initialize_project_graph,
    add_node_to_project,
    remove_nodes_from_project,
    reorder_project_nodes,
)

from designsafe.apps.api.projects_v2.operations.project_publish_operations import (
    get_publication_subtree,
)


@pytest.fixture
def project_with_associations():
    project_value = {
        "title": "Test Project",
        "projectId": "PRJ-1234",
        "users": [],
        "projectType": "experimental",
    }
    experiment_value = {"title": "Test Experiment", "description": "Experiment test"}
    model_config_value = {
        "title": "Test Entity",
        "description": "Entity with file associations",
    }
    project = create_project_metdata(project_value)
    initialize_project_graph("PRJ-1234")

    experiment = create_entity_metadata(
        "PRJ-1234", name=constants.EXPERIMENT, value=experiment_value
    )
    model_config = create_entity_metadata(
        "PRJ-1234", name=constants.EXPERIMENT_MODEL_CONFIG, value=model_config_value
    )

    experiment_node = add_node_to_project(
        "PRJ-1234", "NODE_ROOT", experiment.uuid, experiment.name
    )
    add_node_to_project(
        "PRJ-1234", experiment_node, model_config.uuid, model_config.name
    )

    file_objs = [
        FileObj(
            system="project.system", name="file1", path="/path/to/file1", type="file"
        ),
        FileObj(system="project.system", name="file1", path="/path/to/other/file1", type="file"),
        FileObj(system="project.system", name="dir1", path="/path/to/dir1", type="dir"),
    ]
    add_file_associations(model_config.uuid, file_objs)
    set_file_tags(model_config.uuid, "/path/to/file1", ["test_tag"])
    set_file_tags(model_config.uuid, "/path/to/dir1/nested/file", ["test_tag"])
    set_file_tags(model_config.uuid, "/path/to/other/file1", ["test_tag"])

    yield (project, experiment.uuid)


@pytest.mark.django_db
def test_fixture_works(project_with_associations):
    (project, exp_uuid) = project_with_associations
    assert project.name == "designsafe.project"

    subtree = get_publication_subtree("PRJ-1234", exp_uuid)
    assert len(subtree) == 3

    mc_data = next(
        subtree.nodes[node]
        for node in subtree
        if subtree.nodes[node]["name"] == constants.EXPERIMENT_MODEL_CONFIG
    )

    entity_file_paths = [f["path"] for f in mc_data["value"]["fileObjs"]]
    expected_file_name = (
        "/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/file1"
    )
    expected_dupe_file_name = (
        "/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/file1(1)"
    )
    expected_dir_name = (
        "/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/dir1"
    )

    assert expected_dir_name in entity_file_paths
    assert expected_file_name in entity_file_paths
    assert expected_dupe_file_name in entity_file_paths

    entity_tag_paths = [f["path"] for f in mc_data["value"]["fileTags"]]
    expected_tag_path_1 = (
        "/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/file1"
    )
    expected_tag_path_2 = "/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/dir1/nested/file"
    assert expected_tag_path_1 in entity_tag_paths
    assert expected_tag_path_2 in entity_tag_paths
    assert expected_dupe_file_name in entity_tag_paths
