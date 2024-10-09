from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from portal.apps.users.utils import get_allocations


class AllocationStep(AbstractStep):
    def __init__(self, user):
        """
        Call super class constructor
        """
        super(AllocationStep, self).__init__(user)

    def display_name(self):
        return "Allocations"

    def description(self):
        return """Accessing your allocations. If unsuccessful, verify the PI has added you to the allocations for this project."""

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting allocation retrieval")

    def client_action(self, action, data, request):
        if action == "user_confirm" and request.user.username == self.user.username:
            self.prepare()

    def process(self):
        self.state = SetupState.PROCESSING
        self.log("Retrieving your allocations")
        # Force allocation retrieval from TAS and refresh elasticsearch
        allocations = get_allocations(self.user.username, force=True)
        if not allocations.get('active'):
            self.state = SetupState.USERWAIT
            self.log(
                """User {0} does not have any allocations""".format(self.user.username),
            )
        else:
            self.complete("Allocations retrieved", data=allocations)
