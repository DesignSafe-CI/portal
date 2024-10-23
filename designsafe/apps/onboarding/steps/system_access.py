"""System Allocation Access Step for Onboarding."""

import logging
from designsafe.apps.onboarding.state import SetupState
from designsafe.apps.api.users.utils import get_allocations
from .project_membership import ProjectMembershipStep

logger = logging.getLogger(__name__)


class SystemAccessStep(ProjectMembershipStep):
    """System Access Step for Onboarding."""

    def __init__(self, user):
        """
        Call super class constructor
        """
        super().__init__(user)
        self.user_confirm = "Request System Access"
        self.staff_deny = "Deny System Access Request"

    def display_name(self):
        return "Checking System Access"

    def description(self):
        return """This confirms if you have access to the required HPC systems to
                    access this portal. If not, request access and wait for the
                    system administrator’s approval."""

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting system access check")

    def has_required_systems(self):
        """Check if the user has the required systems for accessing the portal."""

        systems = self.settings["required_systems"]
        if len(systems) == 0:
            return True

        resources = []
        try:
            resources = get_allocations(self.user)["hosts"].keys()
            # If the intersection of the set of systems and resources has
            # items, the user has the necessary allocation
            return len(set(systems).intersection(resources)) > 0
        except Exception as exc:  # pylint: disable=broad-except
            logger.error(exc)
            self.fail("We were unable to retrieve your allocations.")
            return False

    def process(self):
        if self.has_required_systems() or self.is_project_member():
            self.complete("You have the required systems for accessing this portal")
        else:
            self.state = SetupState.USERWAIT
            self.log("Please confirm your request to use this portal.")
