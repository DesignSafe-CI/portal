import pytest
import json
from django.db import IntegrityError
from django.test import Client
from designsafe.apps.api.filemeta.models import FileMetaModel


@pytest.fixture
def filemeta_value_mock():
    value = {"system": "project-1234", "path": "/test/path.txt"}
    return value


@pytest.fixture
def filemeta_db_mock(filemeta_value_mock):
    system_id = filemeta_value_mock["system"]
    path = filemeta_value_mock["path"]
    value = filemeta_value_mock
    file_meta_obj = FileMetaModel.objects.create(value=value)
    return system_id, path, file_meta_obj


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
def test_database_constraint(filemeta_value_mock):
    FileMetaModel.objects.create(value=filemeta_value_mock)
    with pytest.raises(IntegrityError) as excinfo:
        FileMetaModel.objects.create(value=filemeta_value_mock)
        assert "Unique" in str(excinfo.value)


@pytest.mark.django_db
def test_database_get_by_path_system(filemeta_db_mock, filemeta_value_mock):
    FileMetaModel.get_by_path_and_system(
        system=filemeta_value_mock["system"], path=filemeta_value_mock["path"]
    )

    with pytest.raises(FileMetaModel.DoesNotExist):
        FileMetaModel.get_by_path_and_system(system="foo", path="bar/baz.txt")


@pytest.mark.django_db
def test_database_constraint(filemeta_value_mock):
    FileMetaModel.objects.create(value=filemeta_value_mock)
    with pytest.raises(IntegrityError) as excinfo:
        FileMetaModel.objects.create(value=filemeta_value_mock)
        assert "Unique" in str(excinfo.value)


@pytest.mark.django_db
def test_get_file_meta_unauthenticated(client, filemeta_db_mock, mock_access_success):
    system_id, path, file_meta = filemeta_db_mock
    response = client.get(f"/api/filemeta/{system_id}/{path}")
    assert response.status_code == 401


@pytest.mark.django_db
def test_get_file_meta(
    client, authenticated_user, filemeta_db_mock, mock_access_success
):
    system_id, path, file_meta = filemeta_db_mock
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
def test_get_file_meta_using_jwt(
    regular_user_using_jwt, client, filemeta_db_mock, mock_access_success
):
    system_id, path, file_meta = filemeta_db_mock
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
def test_create_file_meta_no_access(
    client, authenticated_user, filemeta_value_mock, mock_access_failure
):
    response = client.post(
        "/api/filemeta/",
        data=json.dumps(filemeta_value_mock),
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_create_file_meta_unauthenticated(client, filemeta_value_mock):
    response = client.post(
        "/api/filemeta/",
        data=json.dumps(filemeta_value_mock),
        content_type="application/json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_create_file_meta(
    client, authenticated_user, filemeta_value_mock, mock_access_success
):
    response = client.post(
        "/api/filemeta/",
        data=json.dumps(filemeta_value_mock),
        content_type="application/json",
    )
    assert response.status_code == 200

    file_meta = FileMetaModel.objects.first()
    assert file_meta.value == filemeta_value_mock


@pytest.mark.django_db
def test_create_file_meta_using_jwt(
    client, regular_user_using_jwt, filemeta_value_mock, mock_access_success
):
    response = client.post(
        "/api/filemeta/",
        data=json.dumps(filemeta_value_mock),
        content_type="application/json",
    )
    assert response.status_code == 200

    file_meta = FileMetaModel.objects.first()
    assert file_meta.value == filemeta_value_mock


@pytest.mark.django_db
def test_create_file_meta_update_existing_entry(
    client,
    authenticated_user,
    filemeta_db_mock,
    filemeta_value_mock,
    mock_access_success,
):
    updated_value = {**filemeta_value_mock, "new_key": "new_value"}

    response = client.post(
        "/api/filemeta/",
        data=json.dumps(updated_value),
        content_type="application/json",
    )
    assert response.status_code == 200

    file_meta = FileMetaModel.objects.first()
    assert file_meta.value == updated_value


@pytest.mark.django_db
def test_create_file_metadata_missing_system_or_path(
    client,
    authenticated_user,
    filemeta_db_mock,
    filemeta_value_mock,
    mock_access_success,
):
    value_missing_system_path = {"foo": "bar"}

    response = client.post(
        "/api/filemeta/",
        data=json.dumps(value_missing_system_path),
        content_type="application/json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_create_using_path_without_starting_slashes_issue_DES_2767 (
    filemeta_value_mock,
):
    # testing that "file.txt" and "/file.txt" are referring to the same
    # file and that "file.txt" is normalized to "/file.txt"
    filemeta_value_mock["path"] = "file.txt"

    file_meta, created = FileMetaModel.create_or_update_file_meta(filemeta_value_mock)
    assert created
    assert file_meta.value["path"] == "/file.txt"


@pytest.mark.django_db
def test_get_using_path_with_or_without_starting_slashes_issue_DES_2767(
    filemeta_value_mock,
):
    filemeta_value_mock["path"] = "file.txt"
    FileMetaModel.create_or_update_file_meta(filemeta_value_mock)

    system = filemeta_value_mock["system"]
    FileMetaModel.get_by_path_and_system(system, "file.txt")
    FileMetaModel.get_by_path_and_system(system, "/file.txt")
