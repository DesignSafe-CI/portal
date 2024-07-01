import pytest
import time
from datetime import timedelta
from designsafe.apps.auth.models import TapisOAuthToken

pytestmark = pytest.mark.django_db


@pytest.fixture
def authenticated_user_with_expired_token(authenticated_user):
    authenticated_user.tapis_oauth.expires_in = 0
    authenticated_user.tapis_oauth.save()
    yield authenticated_user


@pytest.fixture
def authenticated_user_with_valid_token(authenticated_user):
    authenticated_user.tapis_oauth.created = time.time()
    authenticated_user.tapis_oauth.save()
    yield authenticated_user


@pytest.fixture()
def tapis_client_mock(mocker):
    mock_client = mocker.patch("designsafe.apps.auth.models.TapisOAuthToken.client")
    mock_client.access_token.access_token = ("XYZXYZXYZ",)
    mock_client.access_token.expires_in.return_value = timedelta(seconds=2000)
    yield mock_client


def test_valid_user(client, authenticated_user_with_valid_token, tapis_client_mock):
    tapis_oauth = (
        TapisOAuthToken.objects.filter(user=authenticated_user_with_valid_token)
        .select_for_update()
        .get()
    )
    assert not tapis_oauth.expired


def test_expired_user(client, authenticated_user_with_expired_token, tapis_client_mock):
    tapis_oauth = (
        TapisOAuthToken.objects.filter(user=authenticated_user_with_expired_token)
        .select_for_update()
        .get()
    )
    assert tapis_oauth.expired
