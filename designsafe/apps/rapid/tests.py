from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model, models, signals
from designsafe.apps.rapid.models import RapidNHEvent
from unittest import skip
import mock
import requests_mock
from unittest import skip


@skip("Need to mock calls to ES.")
class RapidTests(TestCase):
    """
    Almost all views by anonymous trigger a redirect. However, anonymous CAN create
    tickets. The create ticket view for anonymous includes a Captcha field, so ensure
    that form subclass is activated.
    """

    fixtures = [
        "user-data.json",
    ]

    def setUp(self):
        # configure admin user
        user = get_user_model().objects.get(pk=1)
        user.set_password("admin/password")
        user.save()

        # add user to rapid admin group
        g, created = models.Group.objects.get_or_create(name="Rapid Admin")
        user.groups.add(g)
        user.save()

        # configure regular user
        user = get_user_model().objects.get(pk=2)
        user.set_password("user/password")
        user.save()

    def tearDown(self):
        pass

    def test_index(self):
        """ """
        url = reverse("designsafe_rapid:index")
        self.client.login(username="ds_admin", password="admin/password")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Rapid")

    def test_admin_index_admin(self):
        url = reverse("designsafe_rapid:admin")
        self.client.login(username="ds_admin", password="admin/password")
        resp = self.client.get(url, follow=True)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Rapid Admin")

    def test_admin_index_no_admin(self):
        url = reverse("designsafe_rapid:admin")
        self.client.login(username="ds_user", password="user/password")
        resp = self.client.get(url, follow=True)
        self.assertNotEqual(resp.status_code, 200)

    def test_admin_create_event(self):
        url = reverse("designsafe_rapid:admin_create_event")
        self.client.login(username="ds_admin", password="admin/password")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Create")
