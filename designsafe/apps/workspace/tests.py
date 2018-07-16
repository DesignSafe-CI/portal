from django.test import TestCase, RequestFactory
from django.urls import resolve, reverse
from django.contrib.auth import get_user_model
from designsafe.apps.auth.models import AgaveOAuthToken
from django.http import HttpRequest
from .views import _app_license_type, ApiService
from agavepy.agave import AttrDict

import mock
from mock import Mock

from django.test.client import Client

# class AttrDict(dict):

#     def __getattr__(self, key):
#         return self[key]

#     def __setattr__(self, key, value):
#         self[key] = value


class TestWorkspace(TestCase):
    def generate_file(self):
        try:
            myfile = open('test.json', 'wb')
        finally:
            myfile.close()

        return myfile

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

    def tearDown(self):
        User = get_user_model()
        u = User.objects.get(username="test")
        u.delete()
        # print ("The user is deleted")
        

    # def test_workspace_denies_anonymous(self):
    #     response = self.client.get('/rw/workspace/', follow=True)
    #     # print response.__dict__
    #     self.assertTrue(response.status_code >= 301 < 400)
        
    # def test_workspace_loads(self):
    #     self.client.login(username='test', password='test')
    #     response = self.client.get('/rw/workspace/')
    #     self.assertEqual(response.status_code, 200)
    #     self.assertTrue("Workspace" in response.content)

    # def test_app_license_type_matlab(self):
    #     license = _app_license_type("matlab-2.5.0.6606u8")
    #     self.assertEqual(license, "MATLAB")

    # def test_app_license_type_ls_dyna(self):
    #     license = _app_license_type("ls-dyna-2.5.0.6606u8")
    #     self.assertEqual(license, "LS-DYNA")

    # def test_none_app_license_type(self):
    #     license2 = _app_license_type("opensees-MP-2.5.0.6606u8")
    #     self.assertEqual(license2, None)

# @mock.patch('agavepy.agave.Agave')
# @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')        
class WorkspaceViewtestCase(TestWorkspace):
    """Currently all tests in WorkspaceViewtestCase only run 1 at the time.
    We have some sort of CMS bug that need to be fixed.
    In order to run a test in this class comment all the other tests out."""

#     @mock.patch('agavepy.agave.Agave')
#     @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
#     def test_get_apps_status_code(self, agave_client, agave):
#         """Testing get_apps status code return'
#         """
#         self.client.login(username='test', password='test')
#         agave_client.apps.get.return_value = {
#             "id": "test", 
#             "name": "test"
#         }
#         response = self.client.get('/rw/workspace/api/apps/?app_id=6709u2')
#         self.assertEqual(response.status_code, 200)

# #question: am I testing anything if I moch object and set it to response?
#     @mock.patch('agavepy.agave.Agave')
#     @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
#     def test_get_apps_content(self, agave_client, agave):
#         """Testing get_apps content return'
#         """
#         self.client.login(username='test', password='test')
#         agave_client.apps.get.return_value = {
#             "id": "test", 
#             "name": "test"
#         }
#         response = self.client.get('/rw/workspace/api/apps/?app_id=6709u2')
#         self.assertTrue(response.content, {
#             "id": "test",
#             "license": {"type": None}, 
#             "name": "test"
#         })

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_get_apps_content_passing_AttrDict(self, agave_client, agave):
    #     """Testing get_apps_content_return_passing_AttrDict'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.apps.get.return_value = AttrDict({
    #         "id": "test", 
    #         "name": "test"
    #     })
    #     response = self.client.get('/rw/workspace/api/apps/?app_id=12345')
    #     self.assertTrue(response.content, {
    #         "id": "test",
    #         "license": {"type": None}, 
    #         "name": "test"
    #     })

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_get_meta_status_code_listMetadata(self, agave_client, agave):
    #     """Testing get_meta status code using listMetadata'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.meta.listMetadata.return_value = [{
    #         "id": "test", 
    #         "name": "test"
    #     }]
    #     response = self.client.get('/rw/workspace/api/meta/?q={"$and":[{"name":"ds_apps"},{"value.definition.available":true}]}')
    #     self.assertEqual(response.status_code, 200)

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_get_meta_content_return_listMetadata(self, agave_client, agave):
    #     """Testing get_meta content return using listMetadata'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.meta.listMetadata.return_value = [{
    #         "id": "test", 
    #         "name": "test"
    #     }]
    #     response = self.client.get('/rw/workspace/api/meta/?q={"$and":[{"name":"ds_apps"},{"value.definition.available":true}]}')
    #     self.assertTrue(response.content, [{
    #         "id": "test", 
    #         "name": "test"
    #     }])

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_get_meta_status_code_passing_app_id(self, agave_client, agave):
    #     """Testing get_meta status code passing app_id'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.meta.get.return_value = AttrDict({
    #         "id": "test", 
    #         "name": "test"
    #     })
      
    #     response = self.client.get('/rw/workspace/api/meta/?app_id=12345')
    #     print dir(response)
    #     self.assertEqual(response.status_code, 200)

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_get_meta_content_return_passing_app_id(self, agave_client, agave):
    #     """Testing get_meta content return passing app_id'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.meta.get.return_value = AttrDict({
    #         "id": "test",
    #         "license": {"type": None}, 
    #         "name": "test"
    #     })
      
    #     response = self.client.get('/rw/workspace/api/meta/?app_id=12345')
    #     print dir(response)
    #     self.assertTrue(response.content, AttrDict({
    #         "id": "test",
    #         "license": {"type": None}, 
    #         "name": "test"
    #     }))

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_post_meta_status_code(self, agave_client, agave):
    #     """Testing post_meta status code'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.meta.addMetadata.return_value = {
    #         "status" : "success",
    #         "message" : None
    #       }
    #     response = self.client.post('/rw/workspace/api/meta/?body={"title": "Example Metadata"}')
    #     self.assertEquals(response.status_code, 200)

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_post_meta_response(self, agave_client, agave):
    #     """Testing post_meta response'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.meta.addMetadata.return_value = {
    #         "uuid": "test", 
    #         "owner": "test"
    #       }
    #     response = self.client.post('/rw/workspace/api/meta/?body={"title": "Example Metadata"}')
    #     json_res = response.json()
    #     self.assertTrue(json_res, {
    #         "uuid": "test", 
    #         "title": "Example Metadata"
    #       })

#sekizai
    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_post_meta_status_code_updateMetadata(self, agave_client, agave):
    #     """Testing post_meta status code using updateMetadata'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.meta.updateMetadata.return_value = {
    #         "status" : "success",
    #         "message" : None
    #       }
    #     response = self.client.post('/rw/workspace/api/meta/?uuid=12345&body={"title": "Example Metadata"}', follow=True)
    #     json_res = response.json()
    #     self.assertTrue(json_res, {
    #         "status" : "success",
    #         "message" : None
    #       })

# sekizai
    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_delete_meta_code_status(self, agave_client, agave):
    #     """Testing delete_meta code status'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.meta.deleteMetadata.return_value = AttrDict({
    #         "status" : "success",
    #         "message" : None
    #     })
    #     response = self.client.delete('/rw/workspace/api/meta/?uuid=2831691864876248600-242ac11e-0001-012')
    #     self.assertEqual(response.status_code, 200)

# sekizai
    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_delete_meta_content(self, agave_client, agave):
    #     """Testing delete_meta content return'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.meta.deleteMetadata.return_value = AttrDict({
    #         "status" : "success",
    #         "message" : None
    #     })
    #     # response = self.client.delete('/rw/workspace/api/meta/v2/data/12345')
    #     response = self.client.delete('/rw/workspace/api/meta/?uuid=12345')
    #     self.assertEqual(response, {"status" : "success"})

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_get_jobs_status_code(self, agave_client, agave):
    #     """Testing get_jobs code status'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.jobs.get.return_value = {
    #         "id": "test", 
    #         "name": "test",
    #         "archiveSystem": "test",
    #         "archivePath": "test"
    #     }
    #     agave_client.meta.listMetadata.return_value = [{
    #         "id": "test", 
    #         "name": "test"
    #     }]
    #     response = self.client.get('/rw/workspace/api/jobs/?job_id=12345')
    #     self.assertEqual(response.status_code, 200)

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_get_jobs_content_return(self, agave_client, agave):
    #     """Testing get_jobs content return'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.jobs.get.return_value = {
    #         "id": "test", 
    #         "name": "test",
    #         "archiveSystem": "test",
    #         "archivePath": "test"
    #     }
    #     agave_client.meta.listMetadata.return_value = [{
    #         "id": "test", 
    #         "name": "test"
    #     }]
    #     response = self.client.get('/rw/workspace/api/jobs/?job_id=12345')
    #     self.assertTrue(response.content, {"_embedded": {"metadata": [{"id": "test", "name": "test"}]}, 
    #     "name": "test", "archiveSystem": "test", "archivePath": "test", 
    #     "archiveUrl": "/data/browser/agave/test/test/", "id": "test"})

    # You cannot access body after reading from request's data stream
    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_post_jobs_status_code(self, agave_client, agave):
    #     """Testing post_jobs status code'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.jobs.post.return_value = {"status": "PENDING", "inputs": {"testDirectory"}} # goes to submit jobs and submit
    #     response = self.client.post('/rw/workspace/api/jobs/?body={"title": "Example New_job"}')
    #     # json_res = response.json
    #     # print " ############### I am printing response:"
    #     # print response
    #     # print " ############### I am printing response above:"
    #     self.assertEquals(response.status_code, 200)

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_post_jobs_content(self, agave_client, agave):
    #     """Testing post_jobs content'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.jobs.post.return_value = {"status": "PENDING", "inputs": {"test"}}
    #     response = self.client.post('/rw/workspace/api/jobs/?body={"title": "Example New_job"}')
    #     json_res = response.json
    #     self.assertTrue(json_res, {"status": "PENDING", "inputs": {"testDirectory"}})
    
    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_delete_jobs_status_code(self, agave_client, agave):
    #     """Testing delete_jobs status code'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.jobs.delete.return_value = None
    #     response = self.client.delete('/rw/workspace/api/jobs/?job_id=12345')
    #     self.assertEqual(response.status_code, 200)

    # @mock.patch('agavepy.agave.Agave')
    # @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    # def test_delete_jobs_content_return(self, agave_client, agave):
    #     """Testing delete_jobs content return'
    #     """
    #     self.client.login(username='test', password='test')
    #     agave_client.jobs.delete.return_value = None
    #     response = self.client.delete('/rw/workspace/api/jobs/?job_id=1234')
    #     self.assertTrue(response.content, None)



    # I think the tests below would be good end to end test


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