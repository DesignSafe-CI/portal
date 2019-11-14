import requests
import json
import os
from django.test import TestCase
from django.test import Client
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from mock import Mock, patch
from designsafe.apps.auth.models import AgaveOAuthToken
from urllib import urlencode
from unittest import skip
from django.dispatch import receiver
from django.core.urlresolvers import reverse
from designsafe.apps.api.notifications.models import Notification

import logging


logger = logging.getLogger(__name__)

FILEDIR_PENDING = os.path.join(os.path.dirname(__file__), './json/pending.json')
FILEDIR_SUBMITTING = os.path.join(os.path.dirname(__file__), './json/submitting.json')
FILEDIR_PENDING2 = os.path.join(os.path.dirname(__file__), './json/pending2.json')

webhook_body_pending = json.dumps(json.load(open(FILEDIR_PENDING)))
webhook_body_pending2 = json.dumps(json.load(open(FILEDIR_PENDING2)))
webhook_body_submitting = json.dumps(json.load(open(FILEDIR_SUBMITTING)))

wh_url = reverse('designsafe_api:jobs_wh_handler')

# Create your tests here.
@skip("Need to mock websocket call to redis")
class NotificationsTestCase(TestCase):
    fixtures = ['user-data.json', 'agave-oauth-token-data.json']

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password('password')
        user.save()
        self.user = user
        self.client = Client()

        with open('designsafe/apps/api/fixtures/agave-model-config-meta.json') as f:
            model_config_meta = json.load(f)
        self.model_config_meta = model_config_meta

        with open('designsafe/apps/api/fixtures/agave-file-meta.json') as f:
            file_meta = json.load(f)
        self.file_meta = file_meta

        with open('designsafe/apps/api/fixtures/agave-experiment-meta.json') as f:
            experiment_meta = json.load(f)
        self.experiment_meta = experiment_meta

        with open('designsafe/apps/api/fixtures/agave-project-meta.json') as f:
            project_meta = json.load(f)
        self.project_meta = project_meta

    def test_current_user_is_ds_user(self):
        """
        just making sure the db setup worked.
        """
        self.assertEqual(self.user.username, 'ds_user')

    def test_submitting_webhook_returns_200_and_creates_notification(self):
        r = self.client.post(wh_url, webhook_body_pending, content_type='application/json')
        self.assertEqual(r.status_code, 200)
        n = Notification.objects.last()
        status_from_notification = n.to_dict()['extra']['status']
        self.assertEqual(status_from_notification, 'PENDING')

    def test_2_webhooks_same_status_same_jobId_should_give_1_notification(self):
        r = self.client.post(wh_url, webhook_body_pending, content_type='application/json')

        #assert that sending the same status twice doesn't trigger a second notification.
        r2 = self.client.post(wh_url, webhook_body_pending, content_type='application/json')
        self.assertEqual(Notification.objects.count(), 1)

    def test_2_webhooks_different_status_same_jobId_should_give_2_notifications(self):
        r1 = self.client.post(wh_url, webhook_body_pending, content_type='application/json')

        r2 = self.client.post(wh_url, webhook_body_submitting, content_type='application/json')
        self.assertEqual(Notification.objects.count(), 2)

    def test_2_webhooks_same_status_different_jobId_should_give_2_notifications(self):

        r = self.client.post(wh_url, webhook_body_pending, content_type='application/json')
        r2 = self.client.post(wh_url, webhook_body_pending2, content_type='application/json')

        self.assertEqual(Notification.objects.count(), 2)


class TestJobsWebhookView(TestCase):
    fixtures = ['user-data', 'agave-oauth-token-data']

    @classmethod
    def setUpClass(cls):
        super(TestJobsWebhookView, cls).setUpClass()
        cls.mock_agave_patcher = patch('designsafe.apps.auth.models.AgaveOAuthToken')
        cls.mock_agave = cls.mock_agave_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_agave_patcher.stop()
        super(TestJobsWebhookView, cls).tearDownClass()

    def setUp(self):
        self.user = get_user_model().objects.get(username="ds_user")
        post_save.disconnect(sender=Notification, dispatch_uid="notification_msg")

    @patch('designsafe.apps.api.notifications.receivers.send_notification_ws')
    def test_webhook_job_post(self, mock_receiver):
        post_save.connect(mock_receiver, sender=Notification, dispatch_uid='notification_msg')
        job_event = json.load(open(os.path.join(os.path.dirname(__file__), 'json/submitting.json')))
        mock_receiver.return_value = None
        response = self.client.post(wh_url, json.dumps(job_event), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        n = Notification.objects.last()
        n_status = n.to_dict()['extra']['status']
        self.assertEqual(n_status, job_event['status'])

    @skip('views module no longer exists')
    @patch('designsafe.apps.api.notifications.receivers.send_notification_ws')
    @patch('designsafe.apps.notifications.views.get_user_model')
    def test_webhook_vnc_post(self, get_user_model, mock_receiver):
        u = Mock()
        get_user_model.return_value.objects.get.return_value = u
        u.agave_oauth.client = self.mock_agave
        post_save.connect(mock_receiver, sender=Notification, dispatch_uid='notification_msg')
        mock_receiver.return_value = None
        post_save.connect(mock_receiver, sender=Notification, dispatch_uid='notification_msg')
        vnc_event = {
            "event_type": "VNC",
            "host": "vis.tacc.utexas.edu",
            "port": "2234",
            "address": "vis.tacc.utexas.edu:1234",
            "password": "3373312947011719656-242ac11b-0001-007",
            "owner": "ds_user"
        }
        self.mock_agave.meta.addMetadata.return_value = {}
        link_from_event = "https://vis.tacc.utexas.edu/no-vnc/vnc.html?hostname=vis.tacc.utexas.edu&port=2234&autoconnect=true&password=3373312947011719656-242ac11b-0001-007"

        response = self.client.post(reverse('interactive_wh_handler'), urlencode(vnc_event), content_type='application/x-www-form-urlencoded')

        n = Notification.objects.last()
        action_link = n.to_dict()['action_link']
        self.assertTrue(self.mock_agave.meta.addMetadata.called)
        self.assertEqual(action_link, link_from_event)
        self.assertEqual(n.operation, 'web_link')
        self.assertEqual(response.status_code, 200)

    @skip('views module no longer exists')
    @patch('designsafe.apps.api.notifications.receivers.send_notification_ws')
    @patch('designsafe.apps.notifications.views.get_user_model')
    def test_webhook_interactive_post(self, get_user_model, mock_receiver):
        u = Mock()
        get_user_model.return_value.objects.get.return_value = u
        u.agave_oauth.client = self.mock_agave
        post_save.connect(mock_receiver, sender=Notification, dispatch_uid='notification_msg')
        mock_receiver.return_value = None
        post_save.connect(mock_receiver, sender=Notification, dispatch_uid='notification_msg')
        web_event = {
            "event_type": "WEB",
            "port": "1234",
            "address": "http://designsafe-exec-01.tacc.utexas.edu:1234",
            "job_uuid": "3373312947011719656-242ac11b-0001-007",
            "owner": "ds_user"
        }
        self.mock_agave.meta.addMetadata.return_value = {}
        link_from_event = "http://designsafe-exec-01.tacc.utexas.edu:1234"

        response = self.client.post(reverse('interactive_wh_handler'), urlencode(web_event), content_type='application/x-www-form-urlencoded')

        n = Notification.objects.last()
        action_link = n.to_dict()['action_link']
        self.assertTrue(self.mock_agave.meta.addMetadata.called)
        self.assertEqual(action_link, link_from_event)
        self.assertEqual(n.operation, 'web_link')
        self.assertEqual(response.status_code, 200)
