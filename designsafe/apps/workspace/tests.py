import logging
from django.test import TestCase, RequestFactory
from django.urls import resolve, reverse
from django.contrib.auth import get_user_model
from designsafe.apps.auth.models import AgaveOAuthToken
from django.http import HttpRequest
from .views import _app_license_type, ApiService

import mock
from mock import Mock


logger = logging.getLogger(__name__)
# class AttrDict(dict):

#     def __getattr__(self, key):
#         return self[key]

#     def __setattr__(self, key, value):
#         self[key] = value


class TestWorkspace(TestCase):
    fixtures = ['user-data.json', 'agave-oauth-token-data.json']
    # def setUp(self):
    #     user = get_user_model().objects.get(pk=2)
    #     user.set_password('password')
    #     user.save()
    #     self.user = user

    # def setUp(self):
        # user = get_user_model().objects.get(username='ds_user')
        # user.set_password('password')
        # user.save()
        #token = AgaveOAuthToken(
        #    token_type="bearer",
        #    scope="default",
        #    access_token="1234fsf",
        #    refresh_token="123123123",
        #    expires_in=14400,
        #    created=1523633447)
        #token.user = user
        #token.save()

    # def test_workspace_denies_anonymous(self):
    #     response = self.client.get('/rw/workspace/', follow=True)
    #     # print response.__dict__
    #     self.assertTrue(response.status_code >= 301 < 400)
        
    # # def test_workspace_loads(self):
    # #     self.client.login(username='test', password='test')
    # #     response = self.client.get('/rw/workspace/')
    # #     self.assertEqual(response.status_code, 200)
    # #     self.assertTrue("Workspace" in response.content)

    # def test_app_license_type_matlab(self):
    #     license = _app_license_type("matlab-2.5.0.6606u8")
    #     self.assertEqual(license, "MATLAB")

    # def test_app_license_type_ls_dyna(self):
    #     license = _app_license_type("ls-dyna-2.5.0.6606u8")
    #     self.assertEqual(license, "LS-DYNA")

    # def test_none_app_license_type(self):
    #     license2 = _app_license_type("opensees-MP-2.5.0.6606u8")
    #     self.assertEqual(license2, None)

    def view_to_test(self, view, request, *args, **kwargs):
        view.request = request
        view.args = args
        view.kwargs = kwargs
        return view
        
        
class WorkspaceViewtestCase(TestWorkspace):
    def setUp(self):
        user = get_user_model().objects.get(username='ds_user')
        # user.set_password('password')
        # user.save()
        # token = AgaveOAuthToken(
        #    token_type="bearer",
        #    scope="default",
        #    access_token="1234fsf",
        #    refresh_token="123123123",
        #    expires_in=14400,
        #    created=1523633447)
        # token.user = user
        # token.save()
        # user.agave_oauth = token
        # user.agave_oauth.client = Mock()
        self.user = user


    @mock.patch('agavepy.agave.Agave')
    @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.refresh')
    def test_get_apps(self, agave_refresh, agave):
        """Testing get access to:
            'PotreeConverter-0.1u5'
        """
        agave.return_value.apps.return_value.get.return_value = []
        agave_refresh.return_value = None
        self.user.agave_oauth.client.apps.get.return_value = 'app___get'
        resource = None
        app_version = None
        #Create request
        request = RequestFactory().get('/rw/workspace/api/apps/?app_id=OpenseesMp-3.0.0.6709u2')
        request.user = self.user
        #Initi view
        test_view = ApiService()
        #Setup view for testing
        test_view = self.view_to_test(test_view, request,
                                resource=resource, app_version=app_version)
        res = ApiService.as_view()(request, 'apps')
        logger.info('res: %s', res)
       
        self.assertEqual(res, True)








    # I guess the test below would be a a good end to end test


    #  def test_get(self):
    #     self.client.login(username='test', password='test')
    #     response = self.client.get('/angular/reverse/?djng_url_name=designsafe_workspace%3Acall_api&djng_url_args=apps&app_id=OpenseesMp-3.0.0.6709u2')
    #     # self.assertEqual(response.status_code, 200)
    #     self.assertEqual(response.content, True)
    


    # def test_get_apps(self):
    #     self.client.login(username='test', password='test')

    #     apps = [
    #         AttrDict({
    #             "id": "opensees-SP-2.5.0.6606u7",
    #             "name": "opensees-SP",
    #         })
    #     ]

    #     response = self.client.get('/angular/reverse/?djng_url_name=designsafe_workspace%3Acall_api&djng_url_args=apps&app_id=OpenseesMp-3.0.0.6709u2')
    #     data = response.json()
    #     # self.assertEqual(response.status_code, 200)
    #     self.assertEqual(response.content, data)
    #     # self.assertTrue('response' in data)