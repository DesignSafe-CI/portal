
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.models import SetupEvent
import pytest


pytestmark = pytest.mark.django_db


@pytest.fixture
def onboarding_event(authenticated_user):
    event = SetupEvent.objects.create(
        user=authenticated_user,
        state=SetupState.PENDING,
        step="TestStep",
        message="test message"
    )
    yield event


def test_onboarding_model(authenticated_user, onboarding_event):
    event = SetupEvent.objects.all()[0]
    assert event.user == authenticated_user
    assert event.state == SetupState.PENDING
    assert event.step == "TestStep"
    assert event.message == "test message"


def test_unicode(authenticated_user, onboarding_event):
    event_str = str(onboarding_event)
    assert authenticated_user.username in event_str
    assert "TestStep" in event_str
    assert SetupState.PENDING in event_str
    assert "test message" in event_str
