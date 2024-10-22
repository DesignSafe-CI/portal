"""Methods for executing setup steps for a user."""

import logging
from inspect import isclass
from importlib import import_module
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from designsafe.apps.onboarding.state import SetupState
from designsafe.apps.onboarding.models import SetupEvent
from designsafe.apps.onboarding.steps.abstract import AbstractStep
from designsafe.apps.accounts.models import DesignSafeProfile

logger = logging.getLogger(__name__)


class StepExecuteException(Exception):
    """
    Exception raised when setup step processing
    is interrupted
    """

    def __init__(self, message):
        super().__init__(message)


def new_user_setup_check(user):
    """Check if a user has completed setup steps"""
    extra_steps = getattr(settings, "PORTAL_USER_ACCOUNT_SETUP_STEPS", [])
    if len(extra_steps) == 0:
        logger.info("No extra setup steps for user %s", user.username)
        profile = DesignSafeProfile.objects.get(user=user)
        profile.setup_complete = True
        profile.save()
    else:
        logger.info("Preparing onboarding steps for user  %s", user.username)
        prepare_setup_steps(user)


def log_setup_state(user, message):
    """Log the state of a user's setup"""
    # Create an event log for a user completing setup.
    # This will also signal the front end
    SetupEvent.objects.create(
        user=user,
        step="designsafe.apps.onboarding.execute.execute_setup_steps",
        state=(
            SetupState.COMPLETED if user.profile.setup_complete else SetupState.FAILED
        ),
        message=message,
        data={"setupComplete": user.profile.setup_complete},
    )


def load_setup_step(user, step):
    """Load a setup step class from a string"""
    module_str, callable_str = step.rsplit(".", 1)
    module = import_module(module_str)
    call = getattr(module, callable_str)
    if not isclass(call):
        raise ValueError(f"Setup step {step} is not a class")
    setup_step = call(user)
    if not isinstance(setup_step, AbstractStep):
        raise ValueError(f"Setup step {step} is not a subclass of AbstractStep")
    return setup_step


def prepare_setup_steps(user):
    """
    Set the initial state of all setup steps for a given user
    """
    extra_steps = getattr(settings, "PORTAL_USER_ACCOUNT_SETUP_STEPS", [])
    for step in extra_steps:
        setup_step = load_setup_step(user, step["step"])
        if setup_step.last_event is None:
            setup_step.prepare()


def process_setup_step(setup_step):
    """Process a setup step"""
    setup_step.state = SetupState.PROCESSING
    setup_step.log("Beginning automated processing")
    try:
        setup_step.process()
    except Exception as err:  # pylint: disable=broad-except
        logger.exception("Problem processing setup step")
        setup_step.state = SetupState.ERROR
        setup_step.log(f"Exception: {str(err)}")


@shared_task()
def execute_setup_steps(username):
    """Execute all setup steps for a user"""

    user = get_user_model().objects.get(username=username)

    extra_steps = getattr(settings, "PORTAL_USER_ACCOUNT_SETUP_STEPS", [])
    for step in extra_steps:
        # Restore state of this setup step for this user
        setup_step = load_setup_step(user, step["step"])
        # Run step, if waiting for automatic execution
        # should have this state
        if setup_step.state == SetupState.PENDING:
            process_setup_step(setup_step)
        # If step is not COMPLETED either from this execution or a prior
        # one, then it could be in USERWAIT, STAFFWAIT or FAIL
        # at which point we should raise an execption
        if setup_step.state != SetupState.COMPLETED:
            raise StepExecuteException(setup_step)

    # If execution was not interrupted by a StepExecuteException, such as
    # a step failing to reach the COMPLETED state, mark the user as setup_complete
    user.profile.setup_complete = True
    user.profile.save()
    log_setup_state(user, f"{user.username} setup is now complete")


@shared_task()
def execute_single_step(username, step_name):
    """Execute a single setup step for a user"""

    user = get_user_model().objects.get(username=username)
    # Process specified setup step
    setup_step = load_setup_step(user, step_name)
    process_setup_step(setup_step)
    # If execution was not interrupted after processing this step, i.e.
    # if it completed successfully, continue executing the rest of the onboarding
    # steps
    if setup_step.state == SetupState.COMPLETED:
        execute_setup_steps(username)
