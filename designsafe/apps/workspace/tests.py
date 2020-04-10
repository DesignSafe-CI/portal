import json
from mock import patch
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

    def test_string_representation(self):
        descriptionModel = AppDescription(appId='TestApp0.1', appDescription='Test description')
        self.assertEqual(str(descriptionModel), descriptionModel.appId)

    def test_get_app_description(self):
        AppDescription.objects.create(appId='TestApp0.1', appDescription='Test description')
        self.client.login(username='ds_user', password='user/password')
        url = reverse('designsafe_workspace:call_api', args=('description',))
        response = self.client.get(url, {'app_id': 'TestApp0.1'})
        self.assertContains(response, 'TestApp0.1')


class TestAppsApiViews(TestCase):
    fixtures = ['user-data', 'agave-oauth-token-data']

    @classmethod
    def setUpClass(cls):
        super(TestAppsApiViews, cls).setUpClass()
        cls.mock_client_patcher = patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
        cls.mock_client = cls.mock_client_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_client_patcher.stop()
        super(TestAppsApiViews, cls).tearDownClass()

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password('user/password')
        user.save()

    def test_apps_list(self):
        self.client.login(username='ds_user', password='user/password')
        apps = [
            {
                "id": "app-one",
                "executionSystem": "stampede2"
            },
            {
                "id": "app-two",
                "executionSystem": "stampede2"
            }
        ]

        #need to do a return_value on the mock_client because
        #the calling signature is something like client = Agave(**kwargs).apps.list()
        self.mock_client.apps.list.return_value = apps
        url = reverse('designsafe_workspace:call_api', args=('apps',))
        response = self.client.get(url, follow=True)
        data = response.json()
        # If the request is sent successfully, then I expect a response to be returned.
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data), 2)
        self.assertTrue(data == apps)

    def test_job_submit_notifications(self):
        with open('designsafe/apps/workspace/fixtures/job-submission.json') as f:
            job_data = json.load(f)

        self.mock_client.jobs.submit.return_value = {"status": "ok"}
        self.client.login(username='ds_user', password='user/password')

        url = reverse('designsafe_workspace:call_api', args=('jobs',))
        response = self.client.post(url, json.dumps(job_data), content_type="application/json")
        data = response.json()

        self.assertTrue(self.mock_client.jobs.submit.called)
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(response.status_code, 200)

    def test_job_submit_parse_urls(self):
        with open('designsafe/apps/workspace/fixtures/job-submission.json') as f:
            job_data = json.load(f)
        # the spaces should get quoted out
        job_data["inputs"]["workingDirectory"] = "agave://test.system/name with spaces"

        self.mock_client.jobs.submit.return_value = {"status": "ok"}
        self.client.login(username='ds_user', password='user/password')

        url = reverse('designsafe_workspace:call_api', args=('jobs',))
        response = self.client.post(url, json.dumps(job_data), content_type="application/json")

        self.assertEqual(response.status_code, 200)
        args, kwargs = self.mock_client.jobs.submit.call_args
        body = kwargs["body"]
        input = body["inputs"]["workingDirectory"]
        #the spaces should have been quoted
        self.assertTrue("%20" in input)

    def test_licensed_apps(self):
        # TODO: test to make sure the licensing stuff works
        pass
