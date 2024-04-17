import pytest
import json
from django.test import Client
from designsafe.apps.api.filemeta.models import FileMetaModel


@pytest.fixture
def filemeta_mock():
    system_id = "test_system"
    path = "/test/path"
    value = {"some_key": "some_value"}
    file_meta, _created = FileMetaModel.objects.update_or_create(
        system=system_id, path=path, defaults={"value": value}
    )
    return system_id, path, file_meta


@pytest.fixture
def mock_access_success(mocker):
    """Fixture to mock the listing function to always succeed."""
    mocker.patch("designsafe.apps.api.filemeta.views.listing")


@pytest.fixture
def mock_access_failure(mocker):
    """Fixture to mock the listing function to always raise an exception."""
    mocker.patch(
        "designsafe.apps.api.filemeta.views.listing",
        side_effect=Exception("Access Denied"),
    )


@pytest.mark.django_db
def test_get_file_meta_unauthenticated(client, filemeta_mock, mock_access_success):
    system_id, path, file_meta = filemeta_mock
    response = client.get(f"/api/filemeta/{system_id}/{path}")
    assert response.status_code == 401


@pytest.mark.django_db
def test_get_file_meta(client, authenticated_user, filemeta_mock, mock_access_success):
    system_id, path, file_meta = filemeta_mock
    response = client.get(f"/api/filemeta/{system_id}/{path}")
    assert response.status_code == 200

    assert response.json() == {
        "value": file_meta.value,
        "name": "designsafe.file",
        "lastUpdated": file_meta.last_updated.isoformat(
            timespec="milliseconds"
        ).replace("+00:00", "Z"),
    }


@pytest.mark.django_db
def test_update_file_meta_no_access(
    client, authenticated_user, filemeta_mock, mock_access_failure
):
    system_id, path, file_meta = filemeta_mock
    response = client.post(
        f"/api/filemeta/{system_id}/{path}",
        data=json.dumps({"foo": "bar"}),
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_update_file_meta_unauthenticated(client, filemeta_mock, mock_access_success):
    system_id, path, file_meta = filemeta_mock
    response = client.post(
        f"/api/filemeta/{system_id}/{path}",
        data=json.dumps({"foo": "bar"}),
        content_type="application/json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_update_file_meta_existing(
    client, authenticated_user, filemeta_mock, mock_access_success
):
    system_id, path, _ = filemeta_mock
    new_value = {"different_key": "different_value"}

    response = client.post(
        f"/api/filemeta/{system_id}/{path}",
        data=json.dumps(new_value),
        content_type="application/json",
    )
    assert response.status_code == 200

    file_meta = FileMetaModel.objects.first()
    assert file_meta.value == new_value
