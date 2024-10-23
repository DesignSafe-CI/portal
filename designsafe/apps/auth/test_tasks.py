import pytest
from unittest import mock


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
