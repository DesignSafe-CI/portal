from django.test import TestCase
from django.urls import resolve, reverse
from django.contrib.auth import get_user_model
from designsafe.apps.auth.models import AgaveOAuthToken
from django.http import HttpRequest
from .views import _app_license_type, ApiService

class AttrDict(dict):

    def __getattr__(self, key):
        return self[key]

    def __setattr__(self, key, value):
        self[key] = value


class TestWorspace(TestCase):

    def setUp(self):
        User = get_user_model()
        user = User.objects.create_user('test', 'test@test.com', 'test')
        token = AgaveOAuthToken(
            token_type="bearer",
            scope="default",
            access_token="1234fsf",
            refresh_token="123123123",
            expires_in=14400,
            created=1523633447)
        token.user = user
        token.save()
    
    def test_junk(self):
        self.assertTrue(True)

    def test_workspace_denies_anonymous(self):
        response = self.client.get('/rw/workspace/', follow=True)
        # print response.__dict__
        self.assertTrue(response.status_code >= 301 < 400)
        
    def test_workspace_loads(self):
        self.client.login(username='test', password='test')
        response = self.client.get('/rw/workspace/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue("Workspace" in response.content)

    def test_app_license_type_matlab(self):
        license = _app_license_type("matlab-2.5.0.6606u8")
        self.assertEqual(license, "MATLAB")

    def test_app_license_type_ls_dyna(self):
        license = _app_license_type("ls-dyna-2.5.0.6606u8")
        self.assertEqual(license, "LS-DYNA")

    def test_none_app_license_type(self):
        license2 = _app_license_type("opensees-MP-2.5.0.6606u8")
        self.assertEqual(license2, None)

    
    def test_get_apps(self):
        self.client.login(username='test', password='test')

        apps = [
            AttrDict({
                "id": "opensees-SP-2.5.0.6606u7",
                "name": "opensees-SP",
            })
        ]

        response = self.client.get('/angular/reverse/?djng_url_name=designsafe_workspace%3Acall_api&djng_url_args=apps&app_id=OpenseesMp-3.0.0.6709u2')
        data = response.json()
        # self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, data)
        # self.assertTrue('response' in data)