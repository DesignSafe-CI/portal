""" Pytest fixtures for the onboarding app. """

import pytest
from designsafe.apps.onboarding.models import SetupEvent
from designsafe.apps.onboarding.state import SetupState


@pytest.fixture
def mock_steps(regular_user, settings):
    """Mock steps for testing."""
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {"step": "designsafe.apps.onboarding.steps.test_steps.MockStep"}
    ]
    pending_step = SetupEvent.objects.create(
        user=regular_user,
        step="designsafe.apps.onboarding.steps.test_steps.MockStep",
        state=SetupState.PENDING,
        message="message",
    )

    completed_step = SetupEvent.objects.create(
        user=regular_user,
        step="designsafe.apps.onboarding.steps.test_steps.MockStep",
        state=SetupState.COMPLETED,
        message="message",
    )
    yield (pending_step, completed_step)


@pytest.fixture
def mock_retry_step(regular_user, settings):
    """Mock a step that needs to be retried."""
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            "step": "designsafe.apps.onboarding.steps.test_steps.MockStep",
            "retry": True,
            "settings": {},
        }
    ]
    retry_step = SetupEvent.objects.create(
        user=regular_user,
        step="designsafe.apps.onboarding.steps.test_steps.MockStep",
        state=SetupState.USERWAIT,
        message="message",
    )
    yield retry_step
