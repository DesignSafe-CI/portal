from django.test import TestCase, RequestFactory
from django.urls import resolve, reverse
from django.contrib.auth import get_user_model
from designsafe.apps.auth.models import AgaveOAuthToken
from django.http import HttpRequest
from .views import _app_license_type, ApiService

import mock
from mock import Mock

# class AttrDict(dict):

#     def __getattr__(self, key):
#         return self[key]

#     def __setattr__(self, key, value):
#         self[key] = value


class TestWorkspace(TestCase):

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

# class WorkspaceViewtestCase(TestWorkspace):

#     @mock.patch('agavepy.agave.Agave')
#     @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
#     def test_get_apps(self, agave_client, agave):
#         """Testing return of apps object'
#         """
#         self.client.login(username='test', password='test')
#         agave_client.apps.get.return_value = {
#             "id": "test", 
#             "name": "test"
#         }
#         response = self.client.get('/rw/workspace/api/apps/?app_id=OpenseesMp-3.0.0.6709u2')
#         # print " ############### I am printing response:"
#         # print response
#         # print " ############### I am printing response above:"
#         self.assertEqual(response.status_code, 200)