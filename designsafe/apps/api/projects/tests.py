from designsafe.apps.api.projects.fixtures import (
    exp_instance_meta,
    exp_instance_resp,
    exp_entity_meta,
    exp_entity_json,
)
import pytest


@pytest.mark.skip(reason="TODOv3: Update projects with Tapisv3")
@pytest.mark.django_db
def test_project_instance_get(client, mock_tapis_client, authenticated_user):
    mock_tapis_client.meta.getMetadata.return_value = exp_instance_meta
    resp = client.get("/api/projects/1052668239654088215-242ac119-0001-012/")
    actual = resp.json()
    expected = exp_instance_resp
    assert actual == expected


@pytest.mark.skip(reason="TODOv3: Update projects with Tapisv3")
@pytest.mark.django_db
def test_project_meta_all(client, mock_tapis_client, authenticated_user):
    mock_tapis_client.meta.getMetadata.return_value = exp_instance_meta
    mock_tapis_client.meta.listMetadata.return_value = exp_entity_meta
    resp = client.get("/api/projects/1052668239654088215-242ac119-0001-012/meta/all/")
    actual = resp.json()
    expected = exp_entity_json

    # TODO: write a db fixture to get correct _ui field match (then remove the database dependency forever)
    for i, _ in enumerate(actual):
        del actual[i]["_ui"]
        del expected[i]["_ui"]

    assert actual == expected
