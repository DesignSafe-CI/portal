#python manage.py test designsafe.LoginTest --settings=designsafe.settings.test_settings
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
import mock
from designsafe.apps.auth.models import AgaveOAuthToken
from designsafe.apps.auth.tasks import check_or_create_agave_home_dir
from designsafe.apps.auth.views import agave_oauth_callback


class LoginTestClass(TestCase):
  def setUp (self):
    User = get_user_model()

    user_with_agave = User.objects.create_user('test_with_agave', 'test@test.com', 'test')
    token = AgaveOAuthToken(
        token_type="bearer",
        scope="default",
        access_token="1234abcd",
        refresh_token="123123123",
        expires_in=14400,
        created=1523633447)
    token.user = user_with_agave
    token.save()
    self.rf = RequestFactory()

    user_without_agave = User.objects.create_user('test_without_agave', 'test2@test.com', 'test')
    token = AgaveOAuthToken(
        token_type="bearer",
        scope="default",
        access_token="5555abcd",
        refresh_token="5555555",
        expires_in=14400,
        created=1523633447)
    token.user = user_without_agave
    token.save()
    
  
  def tearDown(self):
    return
    
  """ @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
  @mock.patch('agavepy.agave.Agave')
  def test_has_agave_file_listing(self, agave_client, agave):
    #agaveclient.return_value.files.list.return_value = [] // whatever the listing should look like
    #request.post.return_value = {} // some object that looks like a requests response
    
    self.client.login(username='test_with_agave', password='test')

    agave_client.files.list.return_value = {
        "name": "test",
        "system": "designsafe.storage.working",
        "trail": [{"path": "/", "name": "/", "system": "designsafe.storage.working"}, 
                  {"path": "/test", "name": "test", "system": "designsafe.storage.working"}],
        "path": "test",
        "type": "dir",
        "children": [],
        "permissions": "READ"
      } 

    resp = self.client.get('/api/agave/files/listing/agave/designsafe.storage.working/test', follow=True)

    self.assertEqual(resp.status_code, 200)
    self.assertJSONEqual(resp.content, agave_client.files.list.return_value, msg='Agave homedir listing has unexpected values') """

  @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
  @mock.patch('agavepy.agave.Agave')
  def test_no_agave_file_listing(self, agave_client, agave):
    self.client.login(username='test_without_agave', password='test')
    session = self.client.session
    session['auth_state'] = 'test'
    session.save()
    
    request_without_agave = self.client.post("/auth/agave/callback/?state=test&code=test", follow = True)
    print('Initial Query Status: ' + str(request_without_agave.status_code))
    """ request_without_agave.get.return_value = {
      'state': 'test',
      'session': {'auth_state': 'test'},
      'code': 'test'
      } """
    
    """ agave_client.files.list.return_value = {
        "status": "error", 
        "message": "File/folder does not exist", 
        "version": "test"
        } """
        
    resp = agave_oauth_callback(request_without_agave)
    print('Oauth Callback Status: ' + str(resp))
    self.assertEqual(resp.status_code, 200)

  """ def test_user_without_agave_homedir_gets_redirected(self, mock_client, mock_Agave):

    pass """
    
  """ def test_agave_callbak(self):

      resp = self.client.post("/auth/agave/callback?code=code&state=test", data=data) """
