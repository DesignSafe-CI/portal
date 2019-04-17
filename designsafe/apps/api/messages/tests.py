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
            name=u"test_danger", alert_type=u"alert-danger", message=u"This is a <i>test</i> danger", is_active=True))
        self.alerts.append(PageAlert.objects.create(
            name=u"test_info", alert_type=u"alert-info", message=u"This is a <i>test</i> info", is_active=True))
        self.alerts.append(PageAlert.objects.create(
            name=u"test_success", alert_type=u"alert-success", message=u"This is a <i>test</i> success", is_active=True))
        self.alerts.append(PageAlert.objects.create(
            name=u"test_warning", alert_type=u"alert-warning", message=u"This is a <i>test</i> warning", is_active=True))
        
    def test_page_alerts(self):
        request = RequestFactory().get('/')
        self.add_session_to_request(request)
        load_alerts_into_session(request)
        alert_messages = []
        for alert in self.alerts:
            alert_messages.append({"alert_type": alert.alert_type, "message": alert.message, "is_active": alert.is_active})
        self.assertEqual(request.session['alertslist'], alert_messages)
        self.assertEqual(request.session['alertslist_size'], len(alert_messages))
    
    def add_session_to_request(self, request):
        #Annotate a request object with a session
        middleware = SessionMiddleware()
        middleware.process_request(request)
        request.session.save()