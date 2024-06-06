import pytest
import json


@pytest.mark.django_db
def test_get_project_instance_unauthed(client, project_with_associations):
    _, _, project_uuid = project_with_associations
    response = client.get(f"/api/projects/v2/{project_uuid}/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_get_project_instance(client, authenticated_user, project_with_associations):
    _, _, project_uuid = project_with_associations
    response = client.get(f"/api/projects/v2/{project_uuid}/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_get_project_instance_with_jwt(
    client, regular_user_using_jwt, project_with_associations
):
    _, _, project_uuid = project_with_associations
    response = client.get(f"/api/projects/v2/{project_uuid}/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_patch_project_instance_unauthed(client, project_with_associations):
    _, _, project_uuid = project_with_associations
    map_entry = {
        "name": "Name",
        "uuid": "1234",
        "path": "/something.hazmapper",
        "deployment": "test",
    }
    patch_data = {"patchMetadata": {"hazmapperMaps": [map_entry]}}
    response = client.patch(
        f"/api/projects/v2/{project_uuid}/",
        data=json.dumps(patch_data),
        content_type="application/json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_patch_project_instance_with_jwt(
    client, regular_user_using_jwt, project_with_associations
):
    project, _, project_uuid = project_with_associations
    map_entry = {
        "name": "Name",
        "uuid": "1234",
        "path": "/something.hazmapper",
        "deployment": "test",
    }
    patch_data = {"patchMetadata": {"hazmapperMaps": [map_entry]}}
    response = client.patch(
        f"/api/projects/v2/{project_uuid}/",
        data=json.dumps(patch_data),
        content_type="application/json",
    )
    assert response.status_code == 200
    project.refresh_from_db()
    assert [map_entry] == project.value["hazmapperMaps"]
