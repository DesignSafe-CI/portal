from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from mock import patch, ANY
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.steps.access import RequestAccessStep
import pytest


@pytest.mark.django_db(transaction=True)
class TestRequestAccessStep(TestCase):
    def setUp(self):
        super(TestRequestAccessStep, self).setUp()

        # Create a test user
        User = get_user_model()
        self.user = User.objects.create_user('test', 'test@test.com', 'test')

        self.staff = User.objects.create_user('staff', 'staff@staff.com', 'staff')
        self.staff.is_staff = True

    def tearDown(self):
        super(TestRequestAccessStep, self).tearDown()

    @patch('portal.apps.onboarding.steps.access.RequestAccessStep.log')
    def test_prepare(self, mock_log):
        # prepare should log a STAFFWAIT state
        step = RequestAccessStep(self.user)
        step.prepare()
        self.assertEqual(step.state, SetupState.PENDING)
        mock_log.assert_called_with(ANY)

    @patch('portal.apps.onboarding.steps.access.RequestAccessStep.fail')
    @patch('portal.apps.onboarding.steps.access.RequestAccessStep.complete')
    def test_not_staff(self, mock_complete, mock_fail):
        step = RequestAccessStep(self.user)
        request = RequestFactory().post('/api/setup/test')
        request.user = self.user
        step.client_action("staff_approve", None, request)
        mock_complete.assert_not_called()
        mock_fail.assert_not_called()

    @patch('portal.apps.onboarding.steps.access.RequestAccessStep.complete')
    def test_staff_approve(self, mock_complete):
        # staff_approve should log a COMPLETED state
        step = RequestAccessStep(self.user)
        request = RequestFactory().post('/api/setup/test')
        request.user = self.staff
        step.client_action("staff_approve", None, request)
        mock_complete.assert_called_with(ANY)

    @patch('portal.apps.onboarding.steps.access.RequestAccessStep.fail')
    def test_fail_actions(self, mock_fail):
        # staff_approve should log a FAILED state
        step = RequestAccessStep(self.user)
        request = RequestFactory().post('/api/setup/test')
        request.user = self.staff
        step.client_action("staff_deny", None, request)
        mock_fail.assert_called_with(ANY)
        step.client_action("invalid", None, request)
        mock_fail.assert_called_with(ANY)
