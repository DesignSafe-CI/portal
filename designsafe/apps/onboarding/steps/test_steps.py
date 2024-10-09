
from mock import MagicMock
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.steps.abstract import AbstractStep


class MockStep(AbstractStep):
    """
    Fixture for testing AbstractStep, that
    simply calls spy methods
    """

    def __init__(self, user):
        self.prepare_spy = MagicMock()
        super(MockStep, self).__init__(user)

    def display_name(self):
        return "Mock Step"

    def description(self):
        return "Long description for a mock step"

    def prepare(self):
        self.prepare_spy()


class MockProcessingCompleteStep(AbstractStep):
    """
    Fixture for testing automated processing steps that complete successfully
    """

    def __init__(self, user):
        super(MockProcessingCompleteStep, self).__init__(user)
        self.process_spy = MagicMock()

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Pending")

    def display_name(self):
        return "Mock Processing Complete Step"

    def description(self):
        return "Long description of a mock step that automatically processes then completes"

    def process(self):
        self.complete("Completed")
        self.process_spy()


class MockProcessingFailStep(AbstractStep):
    """
    Fixture for testing automated processing steps that fail
    """

    def __init__(self, user):
        super(MockProcessingFailStep, self).__init__(user)
        self.process_spy = MagicMock()

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Pending")

    def display_name(self):
        return "Mock Processing Fail Step"

    def description(self):
        return "Long description of a mock step that automatically processes then fails"

    def process(self):
        self.fail("Failure")
        self.process_spy()


class MockUserStep(AbstractStep):
    """
    Fixture for testing steps that block for client action
    from the user
    """

    def __init__(self, user):
        super(MockUserStep, self).__init__(user)
        self.client_action_spy = MagicMock()

    def prepare(self):
        self.state = SetupState.USERWAIT
        self.log("Waiting for user")

    def display_name(self):
        return "Mock User Wait Step"

    def description(self):
        return "Long description of a mock step that waits for user interaction"

    def client_action(self, action, data, request):
        if action == "user_confirm" and request.user is self.user:
            self.complete("Complete")
            self.client_action_spy(action, data, request)


class MockStaffStep(AbstractStep):
    """
    Fixture for testing AbstractStaffSteps
    """

    def __init__(self, user):
        super(MockStaffStep, self).__init__(user)
        self.staff_approve_spy = MagicMock()
        self.staff_deny_spy = MagicMock()

    def prepare(self):
        self.state = SetupState.STAFFWAIT
        self.log("Waiting for staff")

    def display_name(self):
        return "Mock Staff Wait Step"

    def description(self):
        return "Long description of a mock step that waits for staff approval or denial"

    def client_action(self, action, data, request):
        if not request.user.is_staff:
            return

        if action == "staff_approve":
            self.complete(
                "Approved by {user}".format(
                    user=request.user.username
                )
            )
            self.staff_approve_spy(action, data, request)
        elif action == "staff_deny":
            self.fail(
                "Denied by {user}".format(
                    user=request.user.username
                )
            )
            self.staff_deny_spy(action, data, request)


class MockErrorStep(AbstractStep):
    """
    Fixture for testing steps that generate exceptions
    """

    def __init__(self, user):
        super(MockErrorStep, self).__init__(user)

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Pending")

    def display_name(self):
        return "Mock Error Step"

    def description(self):
        return "Long description of a mock step that results in error upon processing"

    def process(self):
        raise Exception("MockErrorStep")


class MockInvalidStepClass:
    def __init__(self, user):
        pass


def mock_invalid_step_function():
    pass
