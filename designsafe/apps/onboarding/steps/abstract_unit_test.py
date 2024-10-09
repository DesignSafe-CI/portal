from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from django.db.models import signals
from portal.apps.onboarding.steps.test_steps import MockStep
import pytest


@pytest.fixture(autouse=True)
def disconnect_signal():
    yield signals.post_save.disconnect(sender=SetupEvent, dispatch_uid="setup_event")


@pytest.fixture
def mock_step(settings, regular_user, django_db_reset_sequences):
    yield MockStep(regular_user)


def test_init_not_event(mock_step):
    assert mock_step.last_event is None
    assert len(mock_step.events) == 0


def test_step_name(mock_step):
    assert mock_step.step_name() == "portal.apps.onboarding.steps.test_steps.MockStep"


def test_log(mock_step, regular_user):
    mock_step.state = SetupState.PENDING
    mock_step.log("test event")
    events = SetupEvent.objects.all().filter(user=regular_user)
    assert events[0].message == "test event"
    assert events[0].state == SetupState.PENDING


def test_init_with_event(mock_step, regular_user):
    mock_step.state = SetupState.PENDING
    mock_step.log("event 1")
    mock_step.state = SetupState.COMPLETED
    mock_step.log("event 2")

    # Re-initialize the step to load last event
    mock_step = MockStep(regular_user)
    assert mock_step.last_event.state == SetupState.COMPLETED
    assert len(mock_step.events) == 2


def test_complete(mock_step):
    mock_step.complete("Completed")
    assert mock_step.state == SetupState.COMPLETED
    assert mock_step.last_event.state == SetupState.COMPLETED
    assert SetupEvent.objects.all()[0].message == "Completed"


def test_fail(mock_step):
    mock_step.fail("Failure")
    assert mock_step.state == SetupState.FAILED
    assert mock_step.last_event.state == SetupState.FAILED
    assert SetupEvent.objects.all()[0].message == "Failure"


def test_str(mock_step):
    mock_step.state = SetupState.PENDING
    assert str(mock_step) == "<portal.apps.onboarding.steps.test_steps.MockStep for username is pending>"


def test_settings(mock_step):
    assert mock_step.settings == {'key': 'value'}


def test_step_missing(regular_user, settings):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = []
    mock_step = MockStep(regular_user)
    assert mock_step.settings is None


def test_step_setting_missing(regular_user, settings):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockStep',
        }
    ]
    mock_step = MockStep(regular_user)
    assert mock_step.settings is None
