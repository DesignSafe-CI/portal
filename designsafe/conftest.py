"""Base User pytest fixtures"""

import pytest
import os
import json
from unittest.mock import patch
from django.conf import settings
from designsafe.apps.auth.models import TapisOAuthToken
from designsafe.apps.accounts.models import DesignSafeProfile
from django.contrib.auth.models import Group


@pytest.fixture
def mock_tapis_client(mocker):
    """Tapis client fixture"""
    yield mocker.patch(
        "designsafe.apps.auth.models.TapisOAuthToken.client", autospec=True
    )


@pytest.fixture
def regular_user(django_user_model, mock_tapis_client):
    """Normal User fixture"""
    django_user_model.objects.create_user(
        username="username",
        password="password",
        first_name="Firstname",
        last_name="Lastname",
        email="user@designsafe-ci.org",
    )
    user = django_user_model.objects.get(username="username")
    TapisOAuthToken.objects.create(
        user=user,
        access_token="1234fsf",
        refresh_token="123123123",
        expires_in=14400,
        created=1523633447,
    )
    DesignSafeProfile.objects.create(user=user)

    yield user


@pytest.fixture
def regular_user_using_jwt(regular_user, client):
    """Fixture for regular user who is using jwt for authenticated requests"""
    with patch("designsafe.apps.api.decorators.Tapis") as mock_tapis:
        # Mock the Tapis's validate_token method within the tapis_jwt_login decorator
        mock_validate_token = mock_tapis.return_value.validate_token
        mock_validate_token.return_value = {"tapis/username": regular_user.username}

        client.defaults["HTTP_X_TAPIS_TOKEN"] = "fake_token_string"

        yield client


@pytest.fixture
def project_admin_user(django_user_model):
    django_user_model.objects.create_user(
        username="test_prjadmin",
        password="password",
        first_name="Project",
        last_name="Admin",
    )
    user = django_user_model.objects.get(username="test_prjadmin")
    yield user


@pytest.fixture
def authenticated_user(client, regular_user):
    client.force_login(regular_user)
    yield regular_user


@pytest.fixture
def tapis_tokens_create_mock():
    yield json.load(
        open(
            os.path.join(
                settings.BASE_DIR,
                "designsafe/fixtures/tapis/auth/create-tokens-response.json",
            ),
            "r",
        )
    )


@pytest.fixture
def staff_user(django_user_model, mock_tapis_client):
    django_user_model.objects.create_user(username="staff", password="password")
    user = django_user_model.objects.get(username="staff")
    user.is_staff = True
    user.save()
    TapisOAuthToken.objects.create(
        user=user,
        access_token="1234fsf",
        refresh_token="123123123",
        expires_in=14400,
        created=1523633447,
    )
    DesignSafeProfile.objects.create(user=user)
    yield user


@pytest.fixture
def onboarding_admin_group():
    admin_group = Group(name="Onboarding Admin")
    admin_group.save()
    yield admin_group


@pytest.fixture
def onboarding_admin_user(django_user_model, onboarding_admin_group, mock_tapis_client):
    django_user_model.objects.create_user(username="ob-staff", password="password")
    user = django_user_model.objects.get(username="ob-staff")
    user.groups.add(onboarding_admin_group)

    user.is_staff = True
    user.save()
    TapisOAuthToken.objects.create(
        user=user,
        access_token="1234fsf",
        refresh_token="123123123",
        expires_in=14400,
        created=1523633447,
    )
    DesignSafeProfile.objects.create(user=user)
    yield user


@pytest.fixture
def authenticated_staff(client, staff_user):
    client.force_login(staff_user)
    return staff_user


@pytest.fixture
def authenticated_onboarding_admin(client, onboarding_admin_user):
    client.force_login(onboarding_admin_user)
    return onboarding_admin_user
