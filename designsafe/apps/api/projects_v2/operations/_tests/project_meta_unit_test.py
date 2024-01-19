"""Tests for operations that create/update project metadata."""
import pytest
import networkx as nx
from django import db
from designsafe.apps.api.projects_v2.operations.project_meta_operations import (
    create_project_metdata,
    create_entity_metadata,
    ProjectMetadata,
)
from designsafe.apps.api.projects_v2.operations.graph_operations import (
    initialize_project_graph,
)


@pytest.mark.django_db
def test_project_meta_creation(project_admin_user):
    project_value = {"title": "Test Project", "projectId": "PRJ-1234"}
    prj_meta = create_project_metdata(project_value)

    assert prj_meta.value["projectId"] == "PRJ-1234"
    assert project_admin_user in prj_meta.users.all()

    with pytest.raises(db.IntegrityError):
        create_project_metdata(project_value)


@pytest.mark.django_db
def test_entity_creation(project_admin_user):
    project_value = {"title": "Test Project", "projectId": "PRJ-1234", "users": []}
    create_project_metdata(project_value)

    entity_meta = create_entity_metadata(
        "PRJ-1234",
        name="designsafe.project.experiment",
        value={"title": "My Experiment", "description": "Test Experiment"},
    )

    entity_obj = ProjectMetadata.objects.get(uuid=entity_meta.uuid)
    assert entity_obj.base_project.value["projectId"] == "PRJ-1234"
    assert ProjectMetadata.get_entities_by_project_id("PRJ-1234").count() == 2


@pytest.mark.django_db
def test_graph_init():
    project_value = {"title": "Test Project", "projectId": "PRJ-1234", "users": []}
    create_project_metdata(project_value)
    initialize_project_graph("PRJ-1234")

    graph_value = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph.value
    nx_graph = nx.node_link_graph(graph_value)
    assert len(nx_graph) == 1
    assert nx_graph.nodes.get("NODE_ROOT")["name"] == "designsafe.project"


@pytest.mark.django_db
def test_graph_init_other():
    project_value = {
        "title": "Test Project",
        "projectId": "PRJ-1234",
        "users": [],
        "projectType": "other",
    }
    create_project_metdata(project_value)
    initialize_project_graph("PRJ-1234")

    graph_value = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph.value
    print(graph_value)
    nx_graph = nx.node_link_graph(graph_value)
    assert len(nx_graph) == 2
    assert nx_graph.nodes.get("NODE_ROOT")["name"] == None
