import pytest
from django.test import Client
from designsafe.apps.api.filemeta.models import FileMetaModel


@pytest.fixture
def filemeta_mock():
    system_id = 'test_system'
    path = '/test/path'
    value = {'some_key': 'some_value'}
    file_meta, _created = FileMetaModel.objects.update_or_create(
        system=system_id,
        path=path,
        defaults={'value': value}
    )
    return system_id, path, file_meta


@pytest.fixture
def mock_access_success(mocker):
    """Fixture to mock the listing function to always succeed."""
    mocker.patch('designsafe.apps.api.filemeta.views.listing')


@pytest.fixture
def mock_access_failure(mocker):
    """Fixture to mock the listing function to always raise an exception."""
    mocker.patch('designsafe.apps.api.filemeta.views.listing', side_effect=Exception("Access Denied"))


@pytest.mark.django_db
def test_get_file_meta(client, authenticated_user, filemeta_mock, mock_access_success):
    system_id, path, file_meta = filemeta_mock
    response = client.get(f'/api/filemeta/{system_id}/{path}/')
    assert response.status_code == 200

    json_response = response.json()
    assert json_response["value"] == file_meta.value
    assert json_response["name"] == "designsafe.file"
    assert "lastUpdated" in json_response


@pytest.mark.django_db
def test_get_file_meta_no_access(client, authenticated_user, filemeta_mock, mock_access_failure):
    system_id, path, file_meta = filemeta_mock
    response = client.get(f'/api/filemeta/{system_id}/{path}/')
    assert response.status_code == 403
