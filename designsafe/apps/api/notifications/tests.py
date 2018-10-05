from django.test import TestCase
from django.test import SimpleTestCase
from django.test import Client
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.urls import reverse
import requests
import json
import mock
import os
from unittest import skip
from django.dispatch import receiver

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


    

    
