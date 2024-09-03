import pytest
import requests
from unittest import mock
from django.contrib.auth.models import User
from django.conf import settings
from paramiko.ssh_exception import (
    AuthenticationException,
    SSHException,
)
from .ssh_keys_manager import KeyCannotBeAdded
from .utils import add_pub_key_to_resource, user_has_sms_pairing, send_sms_challenge


@pytest.fixture
def user():
    return User(username="testuser")


@pytest.fixture
def transport_mock():
    return mock.Mock()


@pytest.fixture
def keys_manager_mock(user, transport_mock):
    with mock.patch("apps.api.systems.utils.KeysManager") as mock_manager:
        mock_manager.return_value = mock.Mock(
            get_transport=mock.Mock(return_value=transport_mock)
        )
        yield mock_manager.return_value


@pytest.fixture
def tapis_oauth_mock(user):
    with mock.patch("apps.api.systems.utils.user.tapis_oauth") as mock_oauth:
        mock_oauth.client.systems.getSystem.return_value = mock.Mock(host="example.com")
        yield mock_oauth


def test_add_pub_key_to_resource_success(
    user, keys_manager_mock, tapis_oauth_mock, transport_mock
):
    success, message, status = add_pub_key_to_resource(
        user, "password", "token", "system_id", "pub_key"
    )
    assert success
    assert message == "add_pub_key_to_resource"
    assert status == 200
    keys_manager_mock.add_public_key.assert_called_once_with(
        "system_id", "example.com", "pub_key", port=22, transport=transport_mock
    )


def test_add_pub_key_to_resource_exception(user, keys_manager_mock, tapis_oauth_mock):
    keys_manager_mock.add_public_key.side_effect = Exception("Some error")
    success, message, status = add_pub_key_to_resource(
        user, "password", "token", "system_id", "pub_key"
    )
    assert not success
    assert message == "Some error"
    assert status == 500


def test_add_pub_key_to_resource_authentication_exception(
    user, keys_manager_mock, tapis_oauth_mock
):
    keys_manager_mock.add_public_key.side_effect = AuthenticationException(
        "Authentication failed"
    )
    success, message, status = add_pub_key_to_resource(
        user, "password", "token", "system_id", "pub_key"
    )
    assert not success
    assert message == "Authentication failed"
    assert status == 403


def test_add_pub_key_to_resource_key_cannot_be_added_exception(
    user, keys_manager_mock, tapis_oauth_mock
):
    keys_manager_mock.add_public_key.side_effect = KeyCannotBeAdded(
        "Key cannot be added"
    )
    success, message, status = add_pub_key_to_resource(
        user, "password", "token", "system_id", "pub_key"
    )
    assert not success
    assert message == "KeyCannotBeAdded"
    assert status == 503


def test_add_pub_key_to_resource_ssh_exception(
    user, keys_manager_mock, tapis_oauth_mock
):
    keys_manager_mock.add_public_key.side_effect = SSHException("SSH connection failed")
    success, message, status = add_pub_key_to_resource(
        user, "password", "token", "system_id", "pub_key"
    )
    assert not success
    assert message == "SSHException"
    assert status == 500


@mock.patch("requests.get")
def test_user_has_sms_pairing(mock_get):
    # Mock the response from the requests.get method
    mock_get.return_value.ok = True
    mock_get.return_value.json.return_value = {
        "result": {"value": {"tokens": [{"tokentype": "sms"}]}}
    }

    # Call the function under test
    result = user_has_sms_pairing("test_user")

    # Assert the expected result
    assert result is True

    # Assert that requests.get was called with the correct arguments
    mock_get.assert_called_once_with(
        f"{settings.PIDEA_BASEURL}/token?serial=test_user",
        headers={"Authorization": settings.PIDEA_JWT},
        timeout=10,
    )


@mock.patch("requests.post")
def test_send_sms_challenge(mock_post):
    # Mock the response from the requests.post method
    mock_response = mock.Mock()
    mock_response.ok = True
    mock_response.status_code = 200
    mock_post.return_value = mock_response

    # Call the function under test
    result, status_code = send_sms_challenge("test_user")

    # Assert that the requests.post method was called with the correct arguments
    mock_post.assert_called_once_with(
        f"{settings.PIDEA_BASEURL}/validate/triggerchallenge",
        headers={"Authorization": settings.PIDEA_JWT},
        json={"serial": "test_user"},
        timeout=10,
    )

    # Assert the result and status code
    assert result == "OK"
    assert status_code == 200
