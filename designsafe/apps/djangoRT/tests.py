from django.test import TestCase
from django.core.urlresolvers import reverse
from django.contrib.auth import get_user_model, signals
from designsafe.apps.auth.signals import on_user_logged_in
from unittest import skip
import mock
import requests_mock


class AnonymousViewTests(TestCase):
    """
    Almost all views by anonymous trigger a redirect. However, anonymous CAN create
    tickets. The create ticket view for anonymous includes a Captcha field, so ensure
    that form subclass is activated.
    """

    def test_index(self):
        """
        For anonymous users, the default/index view redirects to the ticketcreate view.
        :return:
        """
        resp = self.client.get(reverse('djangoRT:index'))
        self.assertRedirects(resp, reverse('djangoRT:ticketcreate'))

    def test_my_tickets(self):
        requested_url = reverse('djangoRT:mytickets')
        resp = self.client.get(requested_url)
        expected_redirect = reverse('login') + '?next=' + requested_url
        self.assertRedirects(resp, expected_redirect)

    def test_detail(self):
        requested_url = reverse('djangoRT:ticketdetail', args=[999])
        resp = self.client.get(requested_url)
        expected_redirect = reverse('login') + '?next=' + requested_url
        self.assertRedirects(resp, expected_redirect)

    def test_create(self):
        resp = self.client.get(reverse('djangoRT:ticketcreate'))
        self.assertEquals(resp.status_code, 200)

    def test_create_with_error_context(self):
        query = 'error_page=/page/that/failed&http_referer=https://www.google.com'
        resp = self.client.get(reverse('djangoRT:ticketcreate') + '?' + query)

        self.assertContains(resp, '<input id="id_error_page" name="error_page" '
                                  'type="hidden" value="/page/that/failed" />')
        self.assertContains(resp, '<input id="id_http_referer" name="http_referer" '
                                  'type="hidden" value="https://www.google.com" />')

    def test_reply(self):
        requested_url = reverse('djangoRT:ticketreply', args=[999])
        resp = self.client.get(requested_url)
        expected_redirect = reverse('login') + '?next=' + requested_url
        self.assertRedirects(resp, expected_redirect)

    def test_close(self):
        requested_url = reverse('djangoRT:ticketclose', args=[999])
        resp = self.client.get(requested_url)
        expected_redirect = reverse('login') + '?next=' + requested_url
        self.assertRedirects(resp, expected_redirect)

    def test_attachment(self):
        requested_url = reverse('djangoRT:ticketattachment', args=[999, 1001])
        resp = self.client.get(requested_url)
        expected_redirect = reverse('login') + '?next=' + requested_url
        self.assertRedirects(resp, expected_redirect)


class AuthenticatedViewTests(TestCase):

    fixtures = ['users.json']

    def setUp(self):
        # set password for users
        user = get_user_model().objects.get(pk=2)
        user.set_password('password')
        user.save()

        # disconnect user_logged_in signal
        signals.user_logged_in.disconnect(on_user_logged_in)

    def test_index(self):
        """
        For authenticated users, the default/index view redirects to the mytickets view.
        :return:
        """

        # log user in
        self.client.login(username='ds_user', password='password')

        resp = self.client.get(reverse('djangoRT:index'))
        self.assertRedirects(resp, reverse('djangoRT:mytickets'),
                             fetch_redirect_response=False)

    @requests_mock.Mocker()
    def test_mytickets_none(self, req_mock):

        # log user in
        self.client.login(username='ds_user', password='password')

        # mock login
        req_mock.post('/REST/1.0/', text='RT/4.2.1 200 Ok')

        # mock ticket query
        with open('designsafe/apps/djangoRT/fixtures/user_tickets_resp.txt') as f:
            req_mock.get('/REST/1.0/search/ticket?format=l', text=f.read())

        resp = self.client.get(reverse('djangoRT:mytickets'))
        self.assertContains(resp, 'No tickets to display!')

    @requests_mock.Mocker()
    def test_mytickets_resolved(self, req_mock):

        # log user in
        self.client.login(username='ds_user', password='password')

        # mock login
        req_mock.post('/REST/1.0/', text='RT/4.2.1 200 Ok')

        # mock ticket query
        with open('designsafe/apps/djangoRT/fixtures/user_tickets_resolved_resp.txt') as f:
            req_mock.get('/REST/1.0/search/ticket?format=l', text=f.read())

        resp = self.client.get(reverse('djangoRT:mytickets') + '?show_resolved=1')
        self.assertNotContains(resp, 'No tickets to display!')

    @requests_mock.Mocker()
    def test_detail(self, req_mock):
        # log user in
        self.client.login(username='ds_user', password='password')

        # mock login
        req_mock.post('/REST/1.0/', text='RT/4.2.1 200 Ok')

        ticket_id = 29152

        # mock ticket request
        with open('designsafe/apps/djangoRT/fixtures/ticket_detail.txt') as f:
            req_mock.get('/REST/1.0/ticket/{}/show'.format(ticket_id), text=f.read())

        # mock ticket history
        with open('designsafe/apps/djangoRT/fixtures/ticket_history.txt') as f:
            req_mock.get('/REST/1.0/ticket/{}/history'.format(ticket_id), text=f.read())

        resp = self.client.get(reverse('djangoRT:ticketdetail', args=[ticket_id]))
        self.assertContains(resp, 'Test Post, Please Ignore')

    def test_create(self):
        # log user in
        self.client.login(username='ds_user', password='password')

        resp = self.client.get(reverse('djangoRT:ticketcreate'))
        self.assertNotContains(resp, 'Captcha')

    def test_create_with_error_context(self):
        # log user in
        self.client.login(username='ds_user', password='password')

        query = 'error_page=/page/that/failed&http_referer=https://www.google.com'
        resp = self.client.get(reverse('djangoRT:ticketcreate') + '?' + query)

        self.assertNotContains(resp, 'Captcha')
        self.assertContains(resp, '<input id="id_error_page" name="error_page" '
                                  'type="hidden" value="/page/that/failed" />')
        self.assertContains(resp, '<input id="id_http_referer" name="http_referer" '
                                  'type="hidden" value="https://www.google.com" />')

    @requests_mock.Mocker()
    def test_reply(self, req_mock):
        # log user in
        self.client.login(username='ds_user', password='password')

        # mock login
        req_mock.post('/REST/1.0/', text='RT/4.2.1 200 Ok')

        ticket_id = 29152

        # mock ticket request
        with open('designsafe/apps/djangoRT/fixtures/ticket_detail.txt') as f:
            req_mock.get('/REST/1.0/ticket/{}/show'.format(ticket_id), text=f.read())

        resp = self.client.get(reverse('djangoRT:ticketreply', args=[ticket_id]))
        self.assertContains(resp, 'Reply to #{}'.format(ticket_id))

    @requests_mock.Mocker()
    def test_reopen(self, req_mock):
        # log user in
        self.client.login(username='ds_user', password='password')

        # mock login
        req_mock.post('/REST/1.0/', text='RT/4.2.1 200 Ok')

        ticket_id = 29152

        # mock ticket request
        with open('designsafe/apps/djangoRT/fixtures/ticket_detail_resolved.txt') as f:
            req_mock.get('/REST/1.0/ticket/{}/show'.format(ticket_id), text=f.read())

        resp = self.client.get(reverse('djangoRT:ticketreply', args=[ticket_id]))
        self.assertContains(resp, 'Reopen #{}'.format(ticket_id))

    @requests_mock.Mocker()
    def test_close(self, req_mock):
        # log user in
        self.client.login(username='ds_user', password='password')

        # mock login
        req_mock.post('/REST/1.0/', text='RT/4.2.1 200 Ok')

        ticket_id = 29152

        # mock ticket request
        with open('designsafe/apps/djangoRT/fixtures/ticket_detail.txt') as f:
            req_mock.get('/REST/1.0/ticket/{}/show'.format(ticket_id), text=f.read())

        resp = self.client.get(reverse('djangoRT:ticketclose', args=[ticket_id]))
        self.assertContains(resp, 'Close #{}'.format(ticket_id))


    @skip("TODO implement attachment test - @mrhanlon; 2016-08-10")
    def test_attachment(self):
        # TODO
        pass
