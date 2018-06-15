from django.test import TestCase
from django.urls import resolve, reverse
from django.contrib.auth import get_user_model
from designsafe.apps.auth.models import AgaveOAuthToken

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
        print response.__dict__
        self.assertTrue(response.status_code >= 301 <400)
        
    def test_workspace_loads(self):
        self.client.login(username='test', password='test')
        response = self.client.get('/rw/workspace/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue("Workspace" in response.content)