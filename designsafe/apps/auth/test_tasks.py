import pytest
from unittest import mock
from django.core.exceptions import ObjectDoesNotExist
from tapipy.errors import NotFoundError, BaseTapyException, ForbiddenError
from designsafe.apps.auth.tasks import check_or_configure_system_and_user_directory


@pytest.fixture
def mock_get_user_model(authenticated_user):
    with mock.patch("designsafe.apps.auth.tasks.get_user_model") as mock_get_user_model:
        mock_get_user_model().objects.get.return_value = authenticated_user
        yield mock_get_user_model


@pytest.fixture
def mock_get_tg458981_client():
    with mock.patch(
        "designsafe.apps.auth.tasks.get_tg458981_client"
    ) as mock_get_tg458981_client:
        yield mock_get_tg458981_client


@pytest.fixture
def mock_get_service_account_client():
    with mock.patch(
        "designsafe.apps.auth.tasks.get_service_account_client"
    ) as mock_get_service_account_client:
        yield mock_get_service_account_client


@pytest.fixture
def mock_createKeyPair():
    with mock.patch("designsafe.apps.auth.tasks.createKeyPair") as mock_createKeyPair:
        mock_createKeyPair.return_value = ("private_key", "public_key")
        yield mock_createKeyPair


@pytest.fixture
def mock_register_public_key():
    with mock.patch(
        "designsafe.apps.auth.tasks.register_public_key"
    ) as mock_register_public_key:
        yield mock_register_public_key


@pytest.fixture
def mock_create_system_credentials():
    with mock.patch(
        "designsafe.apps.auth.tasks.create_system_credentials"
    ) as mock_create_system_credentials:
        yield mock_create_system_credentials


@pytest.fixture
def mock_agave_indexer():
    with mock.patch("designsafe.apps.auth.tasks.agave_indexer") as mock_agave_indexer:
        yield mock_agave_indexer


def test_check_or_configure_system_and_user_directory_no_configuration_needed(
    mock_get_user_model, authenticated_user
):
    check_or_configure_system_and_user_directory(
        "testuser", "testsystem", "/testpath", False
    )
    authenticated_user.tapis_oauth.client.files.listFiles.assert_called_once_with(
        systemId="testsystem", path="/testpath"
    )


def test_check_or_configure_system_and_user_directory_user_missing(
    mock_get_user_model,
    mock_register_public_key,
    mock_create_system_credentials,
    mock_createKeyPair,
    mock_get_service_account_client,
):
    mock_get_user_model().objects.get.side_effect = ObjectDoesNotExist
    check_or_configure_system_and_user_directory(
        "testuser", "testsystem", "/testpath", False
    )
    mock_get_user_model().objects.get.assert_called_once_with(username="testuser")


def test_check_or_configure_system_and_user_directory_base_tapy_exception(
    mock_get_user_model,
    authenticated_user,
    mock_register_public_key,
    mock_create_system_credentials,
    mock_createKeyPair,
    mock_get_service_account_client,
):
    authenticated_user.tapis_oauth.client.files.listFiles.side_effect = (
        BaseTapyException
    )
    check_or_configure_system_and_user_directory(
        "testuser", "testsystem", "/testpath", False
    )
    authenticated_user.tapis_oauth.client.files.listFiles.assert_called_once_with(
        systemId="testsystem", path="/testpath"
    )


def test_check_or_configure_system_and_user_directory_create_path(
    mock_get_user_model,
    authenticated_user,
    mock_get_tg458981_client,
    mock_createKeyPair,
    mock_register_public_key,
    mock_get_service_account_client,
    mock_create_system_credentials,
    mock_agave_indexer,
):
    authenticated_user.tapis_oauth.client.files.listFiles.side_effect = NotFoundError
    tg458981_client = mock_get_tg458981_client()
    check_or_configure_system_and_user_directory(
        "testuser", "testsystem", "/testpath", True
    )
    tg458981_client.files.mkdir.assert_called_once_with(
        systemId="testsystem", path="/testpath"
    )
    tg458981_client.files.setFacl.assert_called_once()
    mock_createKeyPair.assert_called_once()
    mock_register_public_key.assert_called_once_with(
        "testuser", "public_key", "testsystem"
    )
    mock_create_system_credentials.assert_called_once()
    mock_agave_indexer.apply_async.assert_called_once()


def test_check_or_configure_system_and_user_directory_forbidden_error(
    mock_get_user_model,
    authenticated_user,
    mock_get_tg458981_client,
    mock_createKeyPair,
    mock_register_public_key,
    mock_get_service_account_client,
    mock_create_system_credentials,
    mock_agave_indexer,
):
    authenticated_user.tapis_oauth.client.files.listFiles.side_effect = ForbiddenError
    tg458981_client = mock_get_tg458981_client()
    check_or_configure_system_and_user_directory(
        "testuser", "testsystem", "/testpath", True
    )
    tg458981_client.files.setFacl.assert_called_once()
    mock_createKeyPair.assert_called_once()
    mock_register_public_key.assert_called_once_with(
        "testuser", "public_key", "testsystem"
    )
    mock_create_system_credentials.assert_called_once()
    mock_agave_indexer.apply_async.assert_called_once()
