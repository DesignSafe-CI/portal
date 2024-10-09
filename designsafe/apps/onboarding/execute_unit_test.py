from mock import MagicMock
from portal.apps.onboarding.steps.test_steps import MockProcessingCompleteStep
from portal.apps.accounts.models import PortalProfile
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.execute import (
    execute_setup_steps,
    execute_single_step,
    prepare_setup_steps,
    load_setup_step,
    log_setup_state,
    new_user_setup_check,
    StepExecuteException
)
import pytest


pytestmark = pytest.mark.django_db


@pytest.fixture
def mock_event_create(mocker):
    yield mocker.patch('portal.apps.onboarding.execute.SetupEvent.objects.create', autospec=True)


def test_log_setup_state_complete(authenticated_user, mock_event_create):
    """
    Test that a SetupEvent is logged for setting the user's setup_complete flag to True
    """
    authenticated_user.profile.setup_complete = True
    log_setup_state(authenticated_user, "test message")
    mock_event_create.assert_called_with(
        user=authenticated_user,
        step="portal.apps.onboarding.execute.execute_setup_steps",
        state=SetupState.COMPLETED,
        message="test message",
        data={"setupComplete": True}
    )


def test_log_setup_state_incomplete(authenticated_user, mock_event_create):
    """
    Test that a SetupEvent is logged for setting the user's setup_complete flag to False
    """
    authenticated_user.profile.setup_complete = False
    log_setup_state(authenticated_user, "test message")
    mock_event_create.assert_called_with(
        user=authenticated_user,
        step="portal.apps.onboarding.execute.execute_setup_steps",
        state=SetupState.FAILED,
        message="test message",
        data={"setupComplete": False}
    )


def test_prepare_setup_steps(authenticated_user, mocker, settings):
    """
    Test that a step is loaded and prepared for a user that does not have step history
    """
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'TestStep'
        }
    ]
    mock_step = MagicMock(
        last_event=None
    )
    mock_loader = mocker.patch('portal.apps.onboarding.execute.load_setup_step')
    mock_loader.return_value = mock_step
    prepare_setup_steps(authenticated_user)
    mock_loader.assert_called_with(authenticated_user, 'TestStep')
    mock_step.prepare.assert_called()


def test_step_loader(authenticated_user):
    """
    Test the dynamic step loader
    """
    step = load_setup_step(
        authenticated_user,
        'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
    )
    assert step is not None


def test_invalid_step_function(authenticated_user):
    """
    Test an invalid configuration that passes a function instead of a class

    This may occur due to a legacy setting "portal.apps.accounts.steps.step_one"
    """
    with pytest.raises(ValueError):
        load_setup_step(
            authenticated_user,
            'portal.apps.onboarding.steps.test_steps.mock_invalid_step_function'
        )


def test_invalid_step_class(authenticated_user):
    """
    Test an invalid configuration that passes a class that is not
    a child of AbstractStep

    This may occur due to a legacy setting "portal.apps.accounts.steps.StepThree"
    """
    with pytest.raises(ValueError):
        load_setup_step(
            authenticated_user,
            'portal.apps.onboarding.steps.test_steps.MockInvalidStepClass'
        )


def test_successful_step(settings, authenticated_user, mocker):
    """
    Test that a step that completes successfully is executed without error
    """
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
        }
    ]
    mock_log_setup_state = mocker.patch('portal.apps.onboarding.execute.log_setup_state')

    prepare_setup_steps(authenticated_user)
    execute_setup_steps(authenticated_user.username)

    # Last event should be COMPLETED for MockPendingCompleteStep
    setup_event = SetupEvent.objects.all().filter(
        step="portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep",
        user=authenticated_user
    ).latest("time")
    assert setup_event.message == "Completed"

    # After last event has completed, setup_complete should be true for user
    profile_result = PortalProfile.objects.all().filter(user=authenticated_user)[0]
    assert profile_result.setup_complete

    mock_log_setup_state.assert_called()


def test_fail_step(settings, authenticated_user):
    """
    Test that a step that fails halts execution.

    MockProcessingFailStep should invoke and leave an event,
    but MockProcessingCompleteStep (which occurs after in the mock setting)
    should not execute due to the previous step failing.
    """
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep'
        },
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
        }
    ]
    with pytest.raises(StepExecuteException):
        prepare_setup_steps(authenticated_user)
        execute_setup_steps(authenticated_user.username)

    setup_events = SetupEvent.objects.all()
    assert len(setup_events) == 4
    setup_event = SetupEvent.objects.all()[3]
    assert setup_event.step == 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep'
    assert setup_event.message == 'Failure'
    profile = PortalProfile.objects.get(user=authenticated_user)
    assert not profile.setup_complete


def test_error_step(settings, authenticated_user):
    """
    Assert that when a setup step causes an error that the error is logged
    """
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockErrorStep'
        }
    ]
    with pytest.raises(StepExecuteException):
        prepare_setup_steps(authenticated_user)
        execute_setup_steps(authenticated_user.username)

    exception_event = SetupEvent.objects.all().filter(
        user=authenticated_user,
        step='portal.apps.onboarding.steps.test_steps.MockErrorStep',
        state=SetupState.ERROR
    )[0]
    assert exception_event.message == "Exception: MockErrorStep"


def test_userwait_step(settings, authenticated_user):
    """
    Test that a step in USERWAIT (or really any state that is not PENDING)
    prevents the rest of the steps from executing

    MockUserWaitStep.prepare should invoke and leave an event,
    but MockPendingCompleteStep (which occurs after in the mock setting)
    should not execute due to the first one not being "COMPLETE".
    """
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockUserStep'
        },
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
        }
    ]
    with pytest.raises(StepExecuteException):
        prepare_setup_steps(authenticated_user)
        execute_setup_steps(authenticated_user.username)

    # Setup event log should not progress due to first
    # step being USERWAIT
    setup_events = SetupEvent.objects.all()
    assert len(setup_events) == 2
    setup_event = SetupEvent.objects.all()[1]
    assert setup_event.step == 'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
    assert setup_event.state == SetupState.PENDING


def test_sequence(settings, authenticated_user):
    """
    Test that execution continues when a step completes

    MockProcessingCompleteStep should complete successfully and log an event.
    MockProcessingFailStep should execute and fail, and leave a log event.
    """
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
        },
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep'
        }
    ]
    with pytest.raises(StepExecuteException):
        prepare_setup_steps(authenticated_user)
        execute_setup_steps(authenticated_user.username)

    setup_events = SetupEvent.objects.all()
    assert len(setup_events) == 6
    assert setup_events[2].step == 'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
    assert setup_events[2].state == SetupState.PROCESSING
    assert setup_events[3].step == 'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
    assert setup_events[3].state == SetupState.COMPLETED
    assert setup_events[4].step == 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep'
    assert setup_events[4].state == SetupState.PROCESSING
    assert setup_events[5].step == 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep'
    assert setup_events[5].state == SetupState.FAILED


def test_sequence_with_history(settings, authenticated_user):
    """
    Test that execution skips a previously completed step

    MockProcessingFailStep should execute and fail, and leave a log event.
    There should be two log events
    """

    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
        },
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep'
        }
    ]

    # Artificially fail MockProcessingCompleteStep
    mock_complete_step = MockProcessingCompleteStep(authenticated_user)
    mock_complete_step.fail("Mock Failure")

    # Artificially execute MockProcessingCompleteStep
    # The latest event instance should be a success,
    # therefore the step should be skipped in the future
    mock_complete_step = MockProcessingCompleteStep(authenticated_user)
    mock_complete_step.process()

    # The previous two transactions should create a history with two steps
    setup_events = SetupEvent.objects.all()
    assert len(setup_events) == 2

    # A new event should be generated for MockProcessingFail
    prepare_setup_steps(authenticated_user)
    setup_events = SetupEvent.objects.all()
    assert len(setup_events) == 3

    with pytest.raises(StepExecuteException):
        execute_setup_steps(authenticated_user.username)

    # Executing should now generate more events
    setup_events = SetupEvent.objects.all()
    assert len(setup_events) == 5

    # MockPendingCompleteStep should appear in the log exactly twice
    complete_events = SetupEvent.objects.all().filter(
        step='portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
    )
    assert len(complete_events) == 2

    # Last event should be MockPendingFailStep
    assert setup_events[4].step == 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep'
    assert setup_events[4].state == SetupState.FAILED


def test_no_setup_steps(settings, authenticated_user):
    """
    Assert that when there are no setup steps, a user is flagged as setup_complete
    """
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = []
    new_user_setup_check(authenticated_user)
    profile = PortalProfile.objects.get(user=authenticated_user)
    assert profile.setup_complete


def test_setup_steps_prepared_from_list(settings, authenticated_user, mocker):
    """
    Assert that when there are setup steps, they are prepared for a user
    """
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = ['onboarding.step']
    mock_prepare = mocker.patch('portal.apps.onboarding.execute.prepare_setup_steps')
    new_user_setup_check(authenticated_user)
    mock_prepare.assert_called_with(authenticated_user)


def test_execute_single_step(mocker, authenticated_user):
    """
    Test that the single step executor triggers a follow up execution of
    the rest of the step queue
    """
    mock_execute = mocker.patch('portal.apps.onboarding.execute.execute_setup_steps')
    execute_single_step(
        authenticated_user.username,
        'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
    )
    mock_execute.assert_called_with(authenticated_user.username)


def test_execute_single_step_does_not_complete(mocker, authenticated_user):
    """
    Test that the single step executor does not trigger a follow up execution of
    the rest of the step queue if the step does not complete
    """
    mock_execute = mocker.patch('portal.apps.onboarding.execute.execute_setup_steps')
    execute_single_step(
        authenticated_user.username,
        'portal.apps.onboarding.steps.test_steps.MockUserStep'
    )
    mock_execute.assert_not_called()
