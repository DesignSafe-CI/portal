from designsafe.apps.api.messages.models import PageAlert
from designsafe.apps.auth.views import load_alerts_into_session, agave_oauth_callback
from django.test import TestCase
from django.test.client import RequestFactory
from django.forms.models import model_to_dict
from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.messages.storage.fallback import FallbackStorage
from mock import patch, Mock

class PageAlertTests(TestCase):

    def setUp(self):
        self.alerts = []
        # Rows are ordered alphanumerically by id.
        self.alerts.append(PageAlert.objects.create(
            alert_id=u"test_danger", alert_type=u"alert-danger", alert_message=u"This is a <i>test</i> danger"))
        self.alerts.append(PageAlert.objects.create(
            alert_id=u"test_info", alert_type=u"alert-info", alert_message=u"This is a <i>test</i> info"))
        self.alerts.append(PageAlert.objects.create(
            alert_id=u"test_success", alert_type=u"alert-success", alert_message=u"This is a <i>test</i> success"))
        self.alerts.append(PageAlert.objects.create(
            alert_id=u"test_warning", alert_type=u"alert-warning", alert_message=u"This is a <i>test</i> warning"))
        
    def test_page_alerts(self):
        request = RequestFactory().get('/')
        self.add_session_to_request(request)
        load_alerts_into_session(request)
        alert_messages = []
        for alert in self.alerts:
            alert_messages.append(model_to_dict(alert))
        self.assertEqual(request.session['alertslist'], alert_messages)
        self.assertEqual(request.session['alertslist_size'], len(alert_messages))
    
    def add_session_to_request(self, request):
        #Annotate a request object with a session
        middleware = SessionMiddleware()
        middleware.process_request(request)
        request.session.save()