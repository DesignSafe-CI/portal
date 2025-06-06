"""Request Access Step for Onboarding."""

from designsafe.apps.onboarding.state import SetupState
from designsafe.apps.onboarding.steps.abstract import AbstractStep


class RequestAccessStep(AbstractStep):
    """Request Access Step for Onboarding."""

    def __init__(self, user):
        """
        Call super class constructor
        """
        super().__init__(user)
        self.user_confirm = "Request Portal Access"
        self.staff_approve = "Grant Portal Access"
        self.staff_deny = "Deny Access Request"

    def display_name(self):
        return "Requesting Access"

    def description(self):
        return """This notifies a system administrator of your request to access the portal.
                  After sending the request, wait for their approval."""

    def prepare(self):
        super().prepare()
        self.state = SetupState.PENDING
        self.log("Waiting for access check")

    def process(self):
        self.state = SetupState.USERWAIT
        self.log("Please click Request Portal Access and then wait for staff approval.")

    def custom_status(self):
        if self.state == SetupState.COMPLETED:
            return "Access Granted"
        return None

    def client_action(self, action, data, request):
        if action == "user_confirm" and request.user == self.user:
            self.state = SetupState.STAFFWAIT
            self.log("Please wait for staff approval")
            return

        if not request.user.is_staff:
            return

        if action == "staff_approve":
            self.complete(f"Portal access request approved by {request.user.username}")
        elif action == "staff_deny":
            self.fail("Portal access request has not been approved.")
        else:
            self.fail(f"Invalid client action {action}")
