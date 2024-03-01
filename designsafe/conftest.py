"""Base User pytest fixtures"""

import pytest
import os
import json
from django.conf import settings
from designsafe.apps.auth.models import TapisOAuthToken


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
        email="user@user.com",
    )
    user = django_user_model.objects.get(username="username")
    TapisOAuthToken.objects.create(
        user=user,
        access_token="1234fsf",
        refresh_token="123123123",
        expires_in=14400,
        created=1523633447,
    )

    yield user


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
