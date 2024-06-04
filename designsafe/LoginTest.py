# python manage.py test designsafe.LoginTest --settings=designsafe.settings.test_settings
import mock
from django.test import TestCase
from designsafe.apps.auth.views import tapis_oauth_callback


class LoginTestClass(TestCase):
    def setUp(self):
        pass

    def tearDown(self):
        pass

    @mock.patch("designsafe.apps.auth.models.TapisOAuthToken.client")
    @mock.patch("tapipy.tapis.Tapis")
    def test_no_tapis_file_listing(self, tapis_client, tapis):
        self.client.login(username="test_without_tapis", password="test")
        session = self.client.session
        session["auth_state"] = "test"
        session.save()

        request_without_tapis = self.client.post(
            "/auth/tapis/callback/?state=test&code=test", follow=True
        )
        resp = tapis_oauth_callback(request_without_tapis)
        print("Oauth Callback Status: " + str(resp))
        self.assertEqual(resp.status_code, 200)
