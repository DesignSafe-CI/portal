"""Tests for operations to convert metadata for publication"""

import pytest
import networkx as nx
from django import db
from designsafe.apps.api.projects_v2 import constants
from designsafe.apps.api.projects_v2.operations.project_meta_operations import (
    create_project_metdata,
    create_entity_metadata,
    add_file_associations,
    set_file_tags,
    FileObj,
)
from designsafe.apps.api.projects_v2.operations.graph_operations import (
    initialize_project_graph,
    add_node_to_project,
)

from designsafe.apps.api.projects_v2.operations.project_publish_operations import (
    get_publication_subtree,
    get_publication_full_tree,
)


@pytest.mark.django_db
def test_publication_subtree(project_with_associations):
    (project, exp_uuid, project_uuid) = project_with_associations
    assert project.name == "designsafe.project"

    subtree, path_mapping = get_publication_subtree("PRJ-1234", exp_uuid)
    assert len(subtree) == 3

    mc_node = next(
        node
        for node in subtree
        if subtree.nodes[node]["name"] == constants.EXPERIMENT_MODEL_CONFIG
    )

    mc_data = subtree.nodes[mc_node]

    entity_file_paths = [f["path"] for f in mc_data["value"]["fileObjs"]]
    expected_file_name = "/published-data-test/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/data/file1"
    expected_dupe_file_name = "/published-data-test/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/data/file1(1)"

    assert expected_file_name in entity_file_paths
    assert expected_dupe_file_name in entity_file_paths

    entity_tag_paths = [f["path"] for f in mc_data["value"]["fileTags"]]
    expected_tag_path_1 = "/published-data-test/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/data/file1"
    expected_tag_path_2 = "/published-data-test/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/data/dir1/nested/file"
    assert expected_tag_path_1 in entity_tag_paths
    assert expected_tag_path_2 in entity_tag_paths
    assert path_mapping[mc_node] == {
        f"/path/to/file1": "/published-data-test/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/data/file1",
        f"/path/to/other/file1": "/published-data-test/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/data/file1(1)",
        f"/path/to/dir1": "/published-data-test/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/data/dir1",
    }


@pytest.mark.django_db
def test_publication_subtree_with_version(project_with_associations):
    (project, exp_uuid, project_uuid) = project_with_associations
    assert project.name == "designsafe.project"

    subtree, path_mapping = get_publication_subtree("PRJ-1234", exp_uuid, version=2)
    assert len(subtree) == 3

    mc_node = next(
        node
        for node in subtree
        if subtree.nodes[node]["name"] == constants.EXPERIMENT_MODEL_CONFIG
    )

    mc_data = subtree.nodes[mc_node]

    entity_file_paths = [f["path"] for f in mc_data["value"]["fileObjs"]]
    expected_file_name = "/published-data-test/PRJ-1234/Experiment--test-experiment--V2/data/Model-config--test-entity/data/file1"
    expected_dupe_file_name = "/published-data-test/PRJ-1234/Experiment--test-experiment--V2/data/Model-config--test-entity/data/file1(1)"

    assert expected_file_name in entity_file_paths
    assert expected_dupe_file_name in entity_file_paths

    entity_tag_paths = [f["path"] for f in mc_data["value"]["fileTags"]]
    expected_tag_path_1 = "/published-data-test/PRJ-1234/Experiment--test-experiment--V2/data/Model-config--test-entity/data/file1"
    expected_tag_path_2 = "/published-data-test/PRJ-1234/Experiment--test-experiment--V2/data/Model-config--test-entity/data/dir1/nested/file"
    assert expected_tag_path_1 in entity_tag_paths
    assert expected_tag_path_2 in entity_tag_paths

    assert path_mapping[mc_node] == {
        f"/path/to/file1": "/published-data-test/PRJ-1234/Experiment--test-experiment--V2/data/Model-config--test-entity/data/file1",
        f"/path/to/other/file1": "/published-data-test/PRJ-1234/Experiment--test-experiment--V2/data/Model-config--test-entity/data/file1(1)",
        f"/path/to/dir1": "/published-data-test/PRJ-1234/Experiment--test-experiment--V2/data/Model-config--test-entity/data/dir1",
    }


@pytest.mark.django_db
def test_tree_multiple_experiments(project_with_associations):
    """
    Set up a project with 2 experiments, and assert that get_publication_full_tree
    returns the correct tree and file mapping.
    """
    (_, exp_uuid, project_uuid) = project_with_associations

    # Add a new experiment with an additional model config, and add it to the tree.
    experiment2_value = {"title": "Test Experiment 2", "description": "Experiment test"}
    model_config2_value = {
        "title": "Test Entity 2",
        "description": "Entity with file associations",
    }

    experiment2 = create_entity_metadata(
        "PRJ-1234", name=constants.EXPERIMENT, value=experiment2_value
    )
    model_config2 = create_entity_metadata(
        "PRJ-1234", name=constants.EXPERIMENT_MODEL_CONFIG, value=model_config2_value
    )

    experiment2_node = add_node_to_project(
        "PRJ-1234", "NODE_ROOT", experiment2.uuid, experiment2.name
    )
    add_node_to_project(
        "PRJ-1234", experiment2_node, model_config2.uuid, model_config2.name
    )

    file_objs = [
        FileObj(
            system="project.system", name="file1", path="/path/to/file3", type="file"
        ),
        FileObj(
            system="project.system",
            name="file3",
            path="/path/to/other/file3",
            type="file",
        ),
        FileObj(system="project.system", name="dir2", path="/path/to/dir2", type="dir"),
    ]
    add_file_associations(model_config2.uuid, file_objs)

    full_tree, full_path_mapping = get_publication_full_tree(
        "PRJ-1234", [exp_uuid, experiment2.uuid]
    )

    assert len(full_tree) == 5

    mc_node_1 = next(
        node
        for node in full_tree
        if full_tree.nodes[node]["value"]["title"] == "Test Entity"
    )

    mc_node_2 = next(
        node
        for node in full_tree
        if full_tree.nodes[node]["value"]["title"] == "Test Entity 2"
    )

    assert full_path_mapping[mc_node_1] == {
        f"/path/to/file1": "/published-data-test/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/data/file1",
        f"/path/to/other/file1": "/published-data-test/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/data/file1(1)",
        f"/path/to/dir1": "/published-data-test/PRJ-1234/Experiment--test-experiment/data/Model-config--test-entity/data/dir1",
    }

    assert full_path_mapping[mc_node_2] == {
        f"/path/to/file3": "/published-data-test/PRJ-1234/Experiment--test-experiment-2/data/Model-config--test-entity-2/data/file3",
        f"/path/to/other/file3": "/published-data-test/PRJ-1234/Experiment--test-experiment-2/data/Model-config--test-entity-2/data/file3(1)",
        f"/path/to/dir2": "/published-data-test/PRJ-1234/Experiment--test-experiment-2/data/Model-config--test-entity-2/data/dir2",
    }
