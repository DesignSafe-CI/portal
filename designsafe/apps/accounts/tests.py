from django.test import TestCase
from django.contrib.auth import get_user_model, signals
from django.contrib.auth.models import Permission
from django.core.urlresolvers import reverse
from designsafe.apps.auth.signals import on_user_logged_in


class NotificationPreferencesTests(TestCase):

    fixtures = ['user-data.json', 'profile-data.json']

    def setUp(self):
        # configure admin user
        user = get_user_model().objects.get(pk=1)
        user.set_password('admin/password')
        perm = Permission.objects.get(codename='view_notification_subscribers')
        user.user_permissions.add(perm)
        user.save()

        # configure regular user
        user = get_user_model().objects.get(pk=2)
        user.set_password('user/password')
        user.save()

        # disconnect user_logged_in signal
        signals.user_logged_in.disconnect(on_user_logged_in)

    def test_mailing_list_access(self):
        """
        Access to mailing list restricted to users with view_notification_subscribers
        permission.
        :return:
        """
        url = reverse('designsafe_accounts:mailing_list_subscription',
                      args=('announcements',))

        self.client.login(username='ds_user', password='user/password')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 403)
        self.client.logout()
        user = get_user_model().objects.get(pk=2)
        perm = Permission.objects.get(codename='view_notification_subscribers')
        user.user_permissions.add(perm)

        self.client.login(username='ds_user', password='user/password')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, '"Name","Email"')

    def test_mailing_list_subscribe(self):
        """
        By default, the mailing list should include all users with default (i.e. NULL)
        notification prefs and those with explicit opt-in notification prefs.
        :return:
        """
        url = reverse('designsafe_accounts:mailing_list_subscription',
                      args=('announcements',))

        ds_user = get_user_model().objects.get(username='ds_user')
        self.assertTrue(ds_user.notification_preferences.announcements)

        self.client.login(username='ds_admin', password='admin/password')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(
            resp, '"{0}","{1}"'.format(ds_user.get_full_name(), ds_user.email))

    def test_mailing_list_unsubscribe(self):
        """
        If a user opts-out of notifications they should not be included in the mailing
        list.
        :return:
        """
        url = reverse('designsafe_accounts:mailing_list_subscription',
                      args=('announcements',))

        ds_user = get_user_model().objects.get(username='ds_user')
        ds_user.notification_preferences.announcements = False
        ds_user.notification_preferences.save()

        self.client.login(username='ds_admin', password='admin/password')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertNotContains(
            resp, '"{0}","{1}"'.format(ds_user.get_full_name(), ds_user.email))

    def test_professional_profile_manage(self):
        url = reverse('designsafe_accounts:manage_pro_profile')
        self.client.login(username='ds_admin', password='admin/password')
        resp = self.client.get(url)
        assert 'TEST BIO' in resp.content
        assert 'test@test.com' in resp.content

