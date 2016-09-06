from django.contrib.auth import get_user_model
from django.test import TestCase
from .models import Token
import requests_mock


class TokenAccessTest(TestCase):

    fixtures = ['user-data.json']

    def test_model_save(self):
        ds_user = get_user_model().objects.get(username='ds_user')
        token = Token(user=ds_user, nickname='Created during testing')
        self.assertTrue(token.token == '', msg='Token has no token value before save')
        token.save()
        self.assertFalse(token.token == '', msg='Token is generated during save')

    def test_model_header(self):
        token = Token.objects.get(user__username='ds_user')
        expected_header = 'Token {0}'.format(token.token)
        self.assertEqual(expected_header, token.header)

    def test_token_access_middleware(self):
        resp = self.client.get('/account/profile/')
        self.assertRedirects(response=resp, expected_url='/login/?next=/account/profile/',
                             fetch_redirect_response=False)

        with open('designsafe/apps/token_access/fixtures/tas_profile.json', 'r') as f:
            tas_mock_response = f.read()

        with requests_mock.mock() as m:
            m.get('/api/v1/users/username/ds_user', text=tas_mock_response)
            token = Token.objects.get(user__username='ds_user')
            resp = self.client.get('/account/profile/', HTTP_AUTHORIZATION=token.header)
            self.assertContains(resp, '<dd>DesignSafe User</dd>', html=True)
