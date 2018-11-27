from django.test import TestCase
from .models.app_descriptions import AppDescription
from django.core.urlresolvers import reverse
from django.contrib.auth import get_user_model


class AppDescriptionModelTest(TestCase):

    fixtures = ['user-data', 'agave-oauth-token-data']

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password('user/password')
        user.save()
        self.user = user

    def test_string_representation(self):
        descriptionModel = AppDescription(appId='TestApp0.1', appDescription='Test description')
        self.assertEqual(str(description), descriptionModel.appId)

    def test_get_app_description(self):
        AppDescription.objects.create(appId='TestApp0.1', appDescription='Test description')
        url = reverse('designsafe_workspace:call_api', args=('description',))
        self.client.login(username='ds_user', password='user/password')
        response = self.client.get(url, {'app_id': 'TestApp0.1'})
        self.assertContains(response, 'TestApp0.1')
