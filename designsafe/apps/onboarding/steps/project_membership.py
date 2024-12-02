"""Project Membership Step for Onboarding."""

import logging
from requests.auth import HTTPBasicAuth
from django.conf import settings
from pytas.http import TASClient
from rt import Rt
from designsafe.apps.onboarding.steps.abstract import AbstractStep
from designsafe.apps.onboarding.state import SetupState


logger = logging.getLogger(__name__)


class ProjectMembershipStep(AbstractStep):
    """Project Membership Step for Onboarding"""

    def __init__(self, user):
        """
        Call super class constructor
        """
        super().__init__(user)
        self.project = self.get_tas_project()
        self.user_confirm = "Request Access to Computation and Data Resources"
        self.staff_approve = f"Add to {self.project['title']}"
        self.staff_deny = "Deny Project Access Request"

    def get_tas_client(self):
        """Get a TAS client"""
        tas_client = TASClient(
            baseURL=settings.TAS_URL,
            credentials={
                "username": settings.TAS_CLIENT_KEY,
                "password": settings.TAS_CLIENT_SECRET,
            },
        )
        return tas_client

    def get_tas_project(self):
        """Get a TAS project"""
        return self.get_tas_client().project(self.settings["project_sql_id"])

    def description(self):
        if self.settings is not None and "description" in self.settings:
            return self.settings["description"]
        return """This confirms if you have access to the project. If not, request access and
                  wait for the system administrator’s approval."""

    def display_name(self):
        return "Access Computation and Data Resources"

    def prepare(self):
        """Prepare the step"""
        self.state = SetupState.PENDING
        self.log("Awaiting project membership check")

    def get_tracker(self):
        """Get a RT client"""
        return Rt(
            settings.DJANGO_RT["RT_HOST"],
            settings.DJANGO_RT["RT_UN"],
            settings.DJANGO_RT["RT_PW"],
            http_auth=HTTPBasicAuth(
                settings.DJANGO_RT["RT_UN"], settings.DJANGO_RT["RT_PW"]
            ),
        )

    def is_project_member(self):
        """Check if the user is a member of the project in TAS"""
        username = self.user.username
        tas_client = self.get_tas_client()
        project_users = tas_client.get_project_users(self.settings["project_sql_id"])
        return any(u["username"] == username for u in project_users)

    def send_project_request(self, request):
        """Send a project request to the RT system"""
        tracker = self.get_tracker()
        ticket_text = f"""
            User {self.user.username} is requesting access to DesignSafe Computation and Data Resources.
            System administrator please visit {request.build_absolute_uri(f'/onboarding/setup/{self.user.username}')}
            to complete this request.
        """

        try:
            if tracker.login():
                result = tracker.create_ticket(
                    Queue=self.settings.get("rt_queue") or "Accounts",
                    Subject=f"Request for DesignSafe Computation and Data Resources for {self.user.username}",
                    Text=ticket_text,
                    Requestor=self.user.email,
                    CF_resource=self.settings.get("rt_tag") or "",
                )
                tracker.logout()

                if not result:
                    raise Exception(  # pylint: disable=broad-exception-raised
                        "Could not create ticket"
                    )

                self.state = SetupState.STAFFWAIT
                self.log(
                    "Thank you for your request. It will be reviewed by TACC staff.",
                    data={"ticket": result},
                )
            else:
                raise Exception(  # pylint: disable=broad-exception-raised
                    "Could not log in to RT"
                )
        except Exception as err:  # pylint: disable=broad-except
            logger.exception(
                msg="Could not create ticket on behalf of user during ProjectMembershipStep"
            )
            logger.error(err.args)
            self.fail(
                "We were unable to submit a portal access request ticket on your behalf."
            )

    def add_to_project(self):
        """Add the user to the TAS project"""
        tas_client = self.get_tas_client()
        # Project number is not the GID number, but the primary key
        # in the database for the project record.
        # When viewing a project in tas.tacc.utexas.edu, you should see "?id=xxxxx"
        # in the address bar. This is the SQL ID
        try:
            tas_client.add_project_user(
                self.settings["project_sql_id"], self.user.username
            )
        except Exception as exc:  # pylint: disable=broad-except
            reason = str(exc)
            if "is already a member" in reason:
                self.complete(
                    f"{self.user.username} is already a member of the {self.project['title']}"
                )
            else:
                self.fail(
                    f"{self.user.username} could not be added to {self.project['title']} due to error {reason}"
                )
                raise exc

    def deny_project_request(self):
        """Deny a project request and close the ticket"""
        ticket_id = None
        for event in self.events:
            if event.data and "ticket" in event.data:
                ticket_id = event.data["ticket"]
        tracker = self.get_tracker()
        request_text = f"""Your request for access to DesignSafe Computation and Data Resources has been
        denied. You can still access the publicly available web pages and data. If you believe this is an error, please submit a help ticket.
        """
        if tracker.login():
            tracker.reply(ticket_id, text=request_text)
            tracker.comment(
                ticket_id,
                text=f"User was not added to the {self.project['title']} TAS Project (GID {self.project['gid']}) at https://{settings.SESSION_COOKIE_DOMAIN}",
            )
            tracker.edit_ticket(ticket_id, Status="resolved")
        else:
            self.fail(f"The portal was unable to close RT Ticket {ticket_id}")

    def close_project_request(self):
        """Close the project request RT ticket"""
        ticket_id = None
        for event in self.events:
            if event.data and "ticket" in event.data:
                ticket_id = event.data["ticket"]
        tracker = self.get_tracker()
        request_text = f"""Your request for  access to DesignSafe Computation and Data Resources has been
        granted. Please login at https://{settings.SESSION_COOKIE_DOMAIN}/onboarding/setup to continue setting up your account.
        """
        if tracker.login():
            tracker.reply(ticket_id, text=request_text)
            tracker.comment(
                ticket_id,
                text=f"User has been added to the {self.project['title']} TAS Project (GID {self.project['gid']}) via https://{settings.SESSION_COOKIE_DOMAIN}",
            )
            tracker.edit_ticket(ticket_id, Status="resolved")
        else:
            self.fail(f"The portal was unable to close RT Ticket {ticket_id}")

    def process(self):
        if self.is_project_member():
            self.complete(
                "You have the required project membership to access this portal."
            )
        else:
            self.state = SetupState.USERWAIT
            data = None
            if self.settings is not None and "userlink" in self.settings:
                data = {"userlink": self.settings["userlink"]}
            self.log("Please confirm your request to use this portal.", data=data)

    def client_action(self, action, data, request):
        if action == "user_confirm":
            self.send_project_request(request)
            return

        if request.user.is_staff and action == "staff_approve":
            try:
                self.add_to_project()
                self.close_project_request()
                self.complete(
                    f"Portal access request approved by {request.user.username}"
                )
            except Exception as err:  # pylint: disable=broad-except
                logger.exception(
                    msg=f"Error during staff_approve on {self.step_name()}"
                )
                logger.error(err.args)
                self.fail(
                    "An error occurred while trying to add this user to the project"
                )
        elif action == "staff_deny":
            self.deny_project_request()
            self.fail("Portal access request has not been approved.")
        else:
            self.fail(f"Invalid client action {action}")
