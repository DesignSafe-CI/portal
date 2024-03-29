import pytest
from django.conf import settings
from designsafe.apps.auth.models import AgaveOAuthToken

@pytest.fixture
def mock_agave_client(mocker):
    yield mocker.patch('designsafe.apps.auth.models.AgaveOAuthToken.client', autospec=True)


@pytest.fixture
def regular_user(django_user_model, mock_agave_client):
    django_user_model.objects.create_user(username="username",
                                          password="password",
                                          first_name="Firstname",
                                          last_name="Lastname",
                                          email="user@user.com")
    django_user_model.objects.create_user(username="username2",
                                          password="password2",
                                          first_name="Firstname2",
                                          last_name="Lastname2",
                                          email="user@user.com2")
    user = django_user_model.objects.get(username="username")
    token = AgaveOAuthToken.objects.create(
        user=user,
        token_type="bearer",
        scope="default",
        access_token="1234fsf",
        refresh_token="123123123",
        expires_in=14400,
        created=1523633447)
    token.save()

    yield user


@pytest.fixture
def project_admin_user(django_user_model):
    django_user_model.objects.create_user(username="test_prjadmin",
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
