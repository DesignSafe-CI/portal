import json
import os
from urllib.parse import urlencode
from mock import patch, MagicMock
from django.test import TestCase, TransactionTestCase, override_settings
from django.contrib.auth import get_user_model
from django.db.models import signals
from django.urls import reverse
from tapipy.tapis import TapisResult
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.api.notifications.receivers import send_notification_ws
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.webhooks.views import validate_tapis_job


class TestValidateTapisJob(TestCase):
    def setUp(self):
        job_status_event = json.load(
            open(os.path.join(os.path.dirname(__file__), "fixtures/job_staging.json"))
        )
        self.tapis_event = TapisResult(**job_status_event)
        mock_client = MagicMock()
        mock_client.jobs.getJob.return_value = self.tapis_event
        mock_user = MagicMock()
        mock_user.tapis_oauth.client = mock_client
        mock_user_model = MagicMock()
        mock_user_model.objects.get.return_value = mock_user
        self.user_model_patcher = patch(
            "designsafe.apps.webhooks.views.get_user_model",
            return_value=mock_user_model,
        )
        self.user_model = self.user_model_patcher.start()

    def tearDown(self):
        self.user_model_patcher.stop()
        pass

    def test_valid_job(self):
        job = validate_tapis_job("id", "ds_user")
        self.assertEqual(job, self.tapis_event)

    def test_valid_job_invalid_user(self):
        with self.assertRaises(ApiException):
            validate_tapis_job("id", "wronguser")

    def test_invalid_state(self):
        self.assertEqual(
            validate_tapis_job("id", "ds_user", disallowed_states=["STAGING_INPUTS"]),
            None,
        )


class TestJobsWebhookView(TransactionTestCase):

    def setUp(self):
        signals.post_save.disconnect(
            sender=Notification, dispatch_uid="notification_msg"
        )
        mock_client = MagicMock()
        mock_user = MagicMock()
        mock_user.tapis_oauth.client = mock_client
        mock_user_model = MagicMock()
        mock_user_model.objects.get.return_value = mock_user
        self.user_model_patcher = patch(
            "designsafe.apps.webhooks.views.get_user_model",
            return_value=mock_user_model,
        )
        self.user_model = self.user_model_patcher.start()

    def tearDown(self):
        signals.post_save.connect(
            send_notification_ws, sender=Notification, dispatch_uid="notification_msg"
        )
        self.user_model_patcher.stop()

    @override_settings(PORTAL_JOB_NOTIFICATION_STATES=["STAGING_INPUTS"])
    @patch("designsafe.apps.webhooks.views.validate_tapis_job")
    def test_webhook_job_post(self, mock_validate_tapis_job):
        job_notification_event = json.load(
            open(os.path.join(os.path.dirname(__file__), "fixtures/job_event.json"))
        )
        job_status_event = json.load(
            open(os.path.join(os.path.dirname(__file__), "fixtures/job_staging.json"))
        )
        mock_validate_tapis_job.return_value = TapisResult(**job_status_event)
        response = self.client.post(
            reverse("webhooks:jobs_wh_handler"),
            json.dumps(job_notification_event),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        n = Notification.objects.last()
        n_status = n.to_dict()["extra"]["status"]
        job_data = json.loads(job_notification_event["event"]["data"])
        self.assertEqual(n_status, job_data["newJobStatus"])

    @override_settings(PORTAL_JOB_NOTIFICATION_STATES=["RUNNING"])
    @patch("designsafe.apps.webhooks.views.validate_tapis_job")
    def test_webhook_job_post_invalid_state(self, mock_validate_tapis_job):
        job_event = json.load(
            open(os.path.join(os.path.dirname(__file__), "fixtures/job_event.json"))
        )
        mock_validate_tapis_job.return_value = TapisResult(**job_event)
        response = self.client.post(
            reverse("webhooks:jobs_wh_handler"),
            json.dumps(job_event),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(Notification.objects.all()), 0)


class TestInteractiveWebhookView(TestCase):
    fixtures = ["user-data", "auth"]

    def setUp(self):
        self.mock_tapis_patcher = patch(
            "designsafe.apps.auth.models.TapisOAuthToken.client", autospec=True
        )
        self.mock_tapis_client = self.mock_tapis_patcher.start()

        self.client.force_login(get_user_model().objects.get(username="ds_user"))

        signals.post_save.disconnect(
            sender=Notification, dispatch_uid="notification_msg"
        )

        self.web_event = {
            "event_type": "interactive_session_ready",
            "address": "https://frontera.tacc.utexas.edu:1234",
            "job_uuid": "e8a57f35-b4a7-4e17-9aea-a6e55564db4d-007",
            "owner": "ds_user",
        }

    def tearDown(self):
        self.mock_tapis_patcher.stop()
        signals.post_save.connect(
            send_notification_ws, sender=Notification, dispatch_uid="notification_msg"
        )

    def test_unsupported_event_type(self):
        response = self.client.post(
            reverse("webhooks:interactive_wh_handler"),
            urlencode({"event_type": "DUMMY"}),
            content_type="application/x-www-form-urlencoded",
        )
        self.assertTrue(response.status_code == 400)

    def test_webhook_web_post(self):
        job_event = json.load(
            open(os.path.join(os.path.dirname(__file__), "fixtures/job_running.json"))
        )
        self.mock_tapis_client.jobs.getJob.return_value = TapisResult(**job_event)

        response = self.client.post(
            reverse("webhooks:interactive_wh_handler"),
            urlencode(self.web_event),
            content_type="application/x-www-form-urlencoded",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Notification.objects.count(), 1)

        n = Notification.objects.last()
        action_link = n.to_dict()["action_link"]
        self.assertEqual(action_link, "https://frontera.tacc.utexas.edu:1234")

    def test_webhook_web_post_no_matching_job(self):
        job_event = json.load(
            open(os.path.join(os.path.dirname(__file__), "fixtures/job_failed.json"))
        )
        self.mock_tapis_client.jobs.get.return_value = TapisResult(**job_event)

        response = self.client.post(
            reverse("webhooks:interactive_wh_handler"),
            urlencode(self.web_event),
            content_type="application/x-www-form-urlencoded",
        )
        # no matching running job so it fails
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Notification.objects.count(), 0)
