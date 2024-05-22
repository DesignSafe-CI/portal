import pytest
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
        FileObj(
            system="project.system",
            name="file1",
            path="/path/to/other/file1",
            type="file",
        ),
        FileObj(system="project.system", name="dir1", path="/path/to/dir1", type="dir"),
    ]
    add_file_associations(model_config.uuid, file_objs)
    set_file_tags(model_config.uuid, "/path/to/file1", ["test_tag"])
    set_file_tags(model_config.uuid, "/path/to/dir1/nested/file", ["test_tag"])
    set_file_tags(model_config.uuid, "/path/to/other/file1", ["test_tag"])

    yield (project, experiment.uuid, project.uuid)
