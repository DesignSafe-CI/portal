
import pytest
from django.test import TransactionTestCase, override_settings
from django.contrib.auth import get_user_model
from mock import patch, MagicMock
from requests import Response
from designsafe.apps.auth.backends import TapisOAuthBackend
# from designsafe.apps.auth.views import launch_setup_checks
from tapipy.tapis import TapisResult


pytestmark = pytest.mark.django_db


# def test_launch_setup_checks(mocker, regular_user, settings):
#     mocker.patch("designsafe.apps.auth.views.new_user_setup_check")
#     mock_execute = mocker.patch("designsafe.apps.auth.views.execute_setup_steps")
#     regular_user.profile.setup_complete = False
#     launch_setup_checks(regular_user)
#     mock_execute.apply_async.assert_called_with(args=["username"])


class TestTapisOAuthBackend(TransactionTestCase):
    def setUp(self):
        super(TestTapisOAuthBackend, self).setUp()
        self.backend = TapisOAuthBackend()
        self.mock_response = MagicMock(autospec=Response)
        self.mock_requests_patcher = patch(
            "designsafe.apps.auth.backends.Tapis.authenticator.get_userinfo", return_value=self.mock_response
        )
        self.mock_requests = self.mock_requests_patcher.start()

        self.mock_user_data_patcher = patch(
            "designsafe.apps.auth.backends.get_user_data",
            return_value={
                "username": "testuser",
                "firstName": "test",
                "lastName": "user",
                "email": "new@email.com",
            },
        )
        self.mock_user_data = self.mock_user_data_patcher.start()

    def tearDown(self):
        super(TestTapisOAuthBackend, self).tearDown()
        self.mock_requests_patcher.stop()
        self.mock_user_data_patcher.stop()

    def test_bad_backend_params(self):
        # Test backend authenticate with no params
        result = self.backend.authenticate()
        self.assertIsNone(result)
        # Test TapisOAuthBackend if params do not indicate tapis
        result = self.backend.authenticate(backend="not_tapis")
        self.assertIsNone(result)

    def test_bad_response_status(self):
        # Test that backend failure responses are handled

        # Mock different return values for the backend response
        self.mock_response.json.return_value = {}
        result = self.backend.authenticate(backend="tapis", token="1234")
        self.assertIsNone(result)
        self.mock_response.json.return_value = {"status": "failure"}
        result = self.backend.authenticate(backend="tapis", token="1234")
        self.assertIsNone(result)

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[])
    def test_new_user(self):
        """Test that a new user is created and returned"""
        self.mock_response.json.return_value = {
            "status": "success",
            "result": {"username": "testuser"},
        }
        result = self.backend.authenticate(backend="tapis", token="1234")
        self.assertEqual(result.username, "testuser")

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[])
    def test_update_existing_user(self):
        """Test that an existing user's information is updated with from info from the Tapis backend response"""

        # Create a pre-existing user with the same username
        user = get_user_model().objects.create_user(
            username="testuser",
            first_name="test",
            last_name="user",
            email="old@email.com",
        )
        self.mock_response.json.return_value = {
            "status": "success",
            "result": {
                "username": "testuser",
            },
        }
        result = self.backend.authenticate(backend="tapis", token="1234")
        # Result user object should be the same
        self.assertEqual(result, user)
        # Existing user object should be updated
        user = get_user_model().objects.get(username="testuser")
        self.assertEqual(user.email, "new@email.com")
