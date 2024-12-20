"""Allocation step for Onboarding."""

from designsafe.apps.onboarding.steps.abstract import AbstractStep
from designsafe.apps.onboarding.state import SetupState
from designsafe.apps.api.users.utils import get_allocations


class AllocationStep(AbstractStep):
    """Allocation Access Step for Onboarding."""

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
        allocations = get_allocations(self.user, force=True)
        if not allocations.get("hosts"):
            self.state = SetupState.USERWAIT
            self.log(f"User {self.user.username} does not have any allocations")
        else:
            self.complete("Allocations retrieved", data=allocations)
