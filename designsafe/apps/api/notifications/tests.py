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
from django.dispatch import receiver

from designsafe.apps.api.notifications.models import Notification

import logging

logger = logging.getLogger(__name__)

FILEDIR = os.path.join(os.path.dirname(__file__), './json/submitting.json')

# Create your tests here.
class NotificationsTestCase(TestCase):
    fixtures = ['user-data.json', 'agave-oauth-token-data.json']

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password('password')
        user.save()
        self.user = user
        self.client = Client()
        self.testdata = open(FILEDIR)
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

    def test_update_status_to_submitting(self):

        self.status = 'not received' 

        # f_json = json.load(open('./json/submitting.json'))
        wh_url = reverse('designsafe_api:jobs_wh_handler')
        r = self.client.post(wh_url, json.dumps(json.load(self.testdata)), content_type='application/json')
        self.assertEqual(r.content, 'OK')
        n = Notification.objects.last()
        status_from_notification = n.to_dict()['extra']['status']
        self.assertEqual(status_from_notification, 'SUBMITTING')



    

    