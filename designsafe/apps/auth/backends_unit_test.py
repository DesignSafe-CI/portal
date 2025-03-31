import pytest
from django.contrib.auth import get_user_model
from mock import Mock
from tapipy.tapis import TapisResult
from tapipy.errors import BaseTapyException
from designsafe.apps.auth.backends import TapisOAuthBackend
from designsafe.apps.auth.views import launch_setup_checks

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_data_mock(mocker):
    mock_user_data = mocker.patch(
        "designsafe.apps.auth.backends.get_user_data",
        return_value={
            "username": "testuser",
            "firstName": "test",
            "lastName": "user",
            "email": "new@email.com",
        },
    )
    return mock_user_data


@pytest.fixture()
def tapis_mock(mocker):
    tapis_patcher = mocker.patch("designsafe.apps.auth.backends.Tapis")
    mock_tapis = Mock()
    mock_tapis.authenticator.get_userinfo.return_value = TapisResult(
        username="testuser"
    )
    tapis_patcher.return_value = mock_tapis
    yield tapis_patcher


@pytest.fixture()
def update_institution_from_tas_mock(mocker):
    yield mocker.patch("designsafe.apps.auth.backends.update_institution_from_tas")


def test_launch_setup_checks(mocker, regular_user, settings):
    # Mock the cache_allocations and execute_setup_steps
    mock_cache_allocations = mocker.patch("designsafe.apps.auth.views.cache_allocations")
    mock_execute = mocker.patch("designsafe.apps.auth.views.execute_setup_steps")
    
    # Run the function under test
    launch_setup_checks(regular_user)
    
    # Assert the mocked methods were called with expected arguments
    mock_cache_allocations.apply_async.assert_called_with(args=(regular_user.username,))
    mock_execute.apply_async.assert_called_with(args=["username"])


def test_bad_backend_params(tapis_mock):
    # Test backend authenticate with no backend params
    backend = TapisOAuthBackend()
    result = backend.authenticate()
    assert result is None

    # Test TapisOAuthBackend if params do not indicate tapis
    result = backend.authenticate(backend="not_tapis")
    assert result is None


def test_bad_response_status(
    tapis_mock, user_data_mock, update_institution_from_tas_mock
):
    """Test that backend failure responses are handled"""
    backend = TapisOAuthBackend()
    mock_tapis = Mock()
    mock_tapis.authenticator.get_userinfo.side_effect = BaseTapyException
    tapis_mock.return_value = mock_tapis
    result = backend.authenticate(backend="tapis", token="1234")
    assert result is None


def test_new_user(tapis_mock, user_data_mock, update_institution_from_tas_mock):
    """Test that a new user is created and returned"""
    backend = TapisOAuthBackend()
    result = backend.authenticate(backend="tapis", token="1234")
    assert result.username == "testuser"


def test_update_existing_user(
    tapis_mock, user_data_mock, update_institution_from_tas_mock
):
    """Test that an existing user's information is updated with from info from the Tapis backend response"""
    backend = TapisOAuthBackend()

    # Create a pre-existing user with the same username
    user = get_user_model().objects.create_user(
        username="testuser",
        first_name="test",
        last_name="user",
        email="old@email.com",
    )
    result = backend.authenticate(backend="tapis", token="1234")
    # Result user object should be the same
    assert result == user
    # Existing user object should be updated
    user = get_user_model().objects.get(username="testuser")
    assert user.email == "new@email.com"
