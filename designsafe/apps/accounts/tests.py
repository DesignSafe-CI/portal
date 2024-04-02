from django.test import TestCase
from django.contrib.auth import get_user_model, signals
from django.contrib.auth.models import Permission
from django.urls import reverse
from unittest import skip
from mock import patch
import pytest

pytestmark = pytest.mark.django_db


class AccountsTests(TestCase):

    fixtures = ["user-data.json", "profile-data.json"]

    def setUp(self):
        # configure admin user
        admin_user = get_user_model().objects.get(pk=1)
        admin_user.set_password("admin/password")
        perm = Permission.objects.get(codename="view_notification_subscribers")
        admin_user.user_permissions.add(perm)
        admin_user.save()

        # configure regular user
        user = get_user_model().objects.get(pk=2)
        user.set_password("user/password")
        user.save()

    def test_mailing_list_access(self):
        """
        Access to mailing list restricted to users with view_notification_subscribers
        permission.
        :return:
        """
        url = reverse(
            "designsafe_accounts:mailing_list_subscription", args=("announcements",)
        )

        self.client.login(username="ds_user", password="user/password")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 403)

        user = get_user_model().objects.get(pk=2)
        perm = Permission.objects.get(codename="view_notification_subscribers")
        user.user_permissions.add(perm)

        self.client.login(username="ds_user", password="user/password")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, '"Name","Email"')

    def test_mailing_list_subscribe(self):
        """
        By default, the mailing list should include all users with default (i.e. NULL)
        notification prefs and those with explicit opt-in notification prefs.
        :return:
        """
        url = reverse(
            "designsafe_accounts:mailing_list_subscription", args=("announcements",)
        )

        ds_user = get_user_model().objects.get(username="ds_user")
        self.assertTrue(ds_user.notification_preferences.announcements)

        self.client.login(username="ds_admin", password="admin/password")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(
            resp, '"{0}","{1}"'.format(ds_user.get_full_name(), ds_user.email)
        )

    def test_mailing_list_unsubscribe(self):
        """
        If a user opts-out of notifications they should not be included in the mailing
        list.
        :return:
        """
        url = reverse(
            "designsafe_accounts:mailing_list_subscription", args=("announcements",)
        )

        ds_user = get_user_model().objects.get(username="ds_user")
        ds_user.notification_preferences.announcements = False
        ds_user.notification_preferences.save()

        self.client.login(username="ds_admin", password="admin/password")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertNotContains(
            resp, '"{0}","{1}"'.format(ds_user.get_full_name(), ds_user.email)
        )

    @skip("Need to mock celery call")
    def test_user_report_access(self):
        """
        Access to user report restricted to users with view_notification_subscribers
        permission.
        :return:
        """
        url = reverse("designsafe_accounts:user_report", args=("announcements",))

        self.client.login(username="ds_user", password="user/password")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 403)
        self.client.logout()
        user = get_user_model().objects.get(pk=2)
        perm = Permission.objects.get(codename="view_notification_subscribers")
        user.user_permissions.add(perm)

        self.client.login(username="ds_user", password="user/password")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Generating User Report")

    @patch("designsafe.apps.accounts.views.forms.TASClient")
    @patch("designsafe.apps.accounts.views.TASUser")
    def test_professional_profile_manage(self, mock_tas_user, mock_form_tas):

        mock_form_tas().institutions.return_value = [{"id": 1, "name": "inst1"}]
        mock_form_tas().countries.return_value = [{"id": 1, "name": "country1"}]

        url = reverse("designsafe_accounts:manage_profile")
        self.client.login(username="ds_admin", password="admin/password")
        resp = self.client.get(url)
        assert "TEST BIO" in str(resp.content)
        assert "test@test.com" in str(resp.content)

    @patch("designsafe.apps.accounts.views.TASClient")
    @patch("designsafe.apps.accounts.views.TASUser")
    @patch("designsafe.apps.accounts.views.forms.TASClient")
    def test_professional_profile_post(self, mock_form_tas, mock_tas_user, mock_tas):

        mock_form_tas().institutions.return_value = [{"id": 1, "name": "inst1"}]
        mock_form_tas().countries.return_value = [{"id": 1, "name": "country1"}]

        def mock_user_side_effect(username="ds_admin", email="test@test.test"):
            return {
                "email": email,
                "piEligibility": True,
                "source": True,
                "id": 1,
                "ethnicity": "White",
                "gender": "Other",
            }

        # pass test for duplicate email check
        mock_tas().get_user.side_effect = mock_user_side_effect
        mock_tas().save_user.side_effect = mock_user_side_effect

        edit_url = reverse("designsafe_accounts:profile_edit")
        self.client.login(username="ds_admin", password="admin/password")

        data = {
            "firstName": "DS",
            "lastName": "User",
            "phone": "555-555-5555",
            "institutionId": "1",
            "title": "Center Non-Researcher Staff",
            "countryId": "1",
            "ethnicity": "White",
            "gender": "Other",
            "bio": "NEW TEST BIO",
            "website": "NEW_WEBSITE",
            "orcid_id": "NEW_ORCID_ID",
            "nh_interests": "13",
            "nh_technical_domains": "5",
            "nh_interests_primary": "1",
            "professional_level": "Staff (support, administration, etc)",
            "research_activities": "6",
        }

        resp = self.client.post(edit_url, data)

        manage_url = reverse("designsafe_accounts:manage_profile")
        resp = self.client.get(manage_url)
        assert "NEW TEST BIO" in str(resp.content)
        assert "NEW_WEBSITE" in str(resp.content)
        assert "NEW_ORCID_ID" in str(resp.content)
