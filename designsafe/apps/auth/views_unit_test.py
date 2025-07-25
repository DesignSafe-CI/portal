"""DesignSafe Auth Tapis OAuth flow view tests"""

import pytest
from django.contrib.auth import get_user
from django.conf import settings
from django.urls import reverse
from django.http import HttpResponseRedirect
from designsafe.apps.auth.views import launch_setup_checks, LogoutView


TEST_STATE = "ABCDEFG123456"

pytestmark = pytest.mark.django_db


def test_auth_tapis(client, mocker):
    """Test auth flow redirect"""
    mocker.patch("designsafe.apps.auth.views._get_auth_state", return_value=TEST_STATE)

    response = client.get("/auth/tapis/", follow=False)

    tapis_authorize = (
        f"{settings.TAPIS_TENANT_BASEURL}/v3/oauth2/authorize"
        f"?client_id=client_id&redirect_uri=http://testserver/auth/tapis/callback/&response_type=code&state={TEST_STATE}"
    )

    assert response.status_code == 302
    assert response.url == tapis_authorize
    assert client.session["auth_state"] == TEST_STATE


def test_tapis_callback(client, mocker, regular_user, tapis_tokens_create_mock):
    """Test successful Tapis callback"""
    mock_authenticate = mocker.patch("designsafe.apps.auth.views.authenticate")
    mock_tapis_token_post = mocker.patch("designsafe.apps.auth.views.requests.post")
    mock_launch_setup_checks = mocker.patch(
        "designsafe.apps.auth.views.launch_setup_checks"
    )

    # add auth to session
    session = client.session
    session["auth_state"] = TEST_STATE
    session.save()

    mock_tapis_token_post.return_value.json.return_value = tapis_tokens_create_mock
    mock_tapis_token_post.return_value.status_code = 200
    mock_authenticate.return_value = regular_user

    response = client.get(
        f"/auth/tapis/callback/?state={TEST_STATE}&code=83163624a0bc41c4a376e0acb16a62f9"
    )
    assert response.status_code == 302
    assert response.url == settings.LOGIN_REDIRECT_URL
    assert mock_launch_setup_checks.call_count == 1


def test_tapis_callback_no_code(client):
    """Test Tapis callback with no auth code"""
    # add auth to session
    session = client.session
    session["auth_state"] = TEST_STATE
    session.save()

    response = client.get(f"/auth/tapis/callback/?state={TEST_STATE}")
    assert response.status_code == 302
    assert response.url == reverse("logout")


def test_tapis_callback_mismatched_state(client):
    """Test Tapis callback with mismatched state"""
    # add auth to session
    session = client.session
    session["auth_state"] = "TEST_STATE"
    session.save()
    response = client.get("/auth/tapis/callback/?state=bar")
    assert response.status_code == 400


def test_launch_setup_checks(regular_user, mocker):
    # Mock external dependencies
    mock_execute_setup_steps = mocker.patch(
        "designsafe.apps.auth.views.execute_setup_steps"
    )
    mock_new_user_setup_check = mocker.patch(
        "designsafe.apps.auth.views.new_user_setup_check"
    )
    mock_cache_allocations = mocker.patch(
        "designsafe.apps.auth.views.cache_allocations"
    )

    # Run the function under test
    launch_setup_checks(regular_user)

    # Assert mocks were called with the expected arguments
    mock_new_user_setup_check.assert_called_with(regular_user)
    mock_cache_allocations.apply_async.assert_called_with(
        args=(regular_user.username,)
    )
    mock_execute_setup_steps.apply_async.assert_called_with(
        args=[regular_user.username]
    )


def test_launch_setup_checks_already_onboarded(regular_user, mocker):
    regular_user.profile.setup_complete = True
    mocker.patch("designsafe.apps.auth.views.new_user_setup_check")
    mock_execute_setup_steps = mocker.patch(
        "designsafe.apps.auth.views.execute_setup_steps"
    )
    mock_cache_allocations = mocker.patch(
        "designsafe.apps.auth.views.cache_allocations"
    )
    launch_setup_checks(regular_user)
    mock_cache_allocations.apply_async.assert_called_with(args=(regular_user.username,))
    mock_execute_setup_steps.apply_async.assert_not_called()


@pytest.mark.django_db
def test_logout_redirects_correctly_and_logs_out(client, settings):
    request = client.get('/logout')

    response = LogoutView().dispatch(request)

    expected_url = f"{settings.TAPIS_TENANT_BASEURL}/v3/oauth2/logout?redirect_url=https://{request.get_host()}/{settings.LOGOUT_REDIRECT_URL}"

    assert isinstance(response, HttpResponseRedirect)
    assert response.status_code == 302
    assert response.url == expected_url
    assert not get_user(client).is_authenticated
