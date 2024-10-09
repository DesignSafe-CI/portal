import logging
from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from django.conf import settings
from requests.auth import HTTPBasicAuth
from pytas.http import TASClient
from rt import Rt


# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class ProjectMembershipStep(AbstractStep):
    def __init__(self, user):
        """
        Call super class constructor
        """
        super(ProjectMembershipStep, self).__init__(user)
        self.project = self.get_tas_project()
        self.user_confirm = "Request Project Access"
        self.staff_approve = "Add to {project}".format(project=self.project['title'])
        self.staff_deny = "Deny Project Access Request"

    def get_tas_client(self):
        tas_client = TASClient(
            baseURL=settings.TAS_URL,
            credentials={
                'username': settings.TAS_CLIENT_KEY,
                'password': settings.TAS_CLIENT_SECRET
            }
        )
        return tas_client

    def get_tas_project(self):
        return self.get_tas_client().project(self.settings['project_sql_id'])

    def description(self):
        if self.settings is not None and 'description' in self.settings:
            return self.settings['description']
        return """This confirms if you have access to the project. If not, request access and
                  wait for the system administrator’s approval."""

    def display_name(self):
        return "Checking Project Membership"

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting project membership check")

    def get_tracker(self):
        return Rt(
            settings.RT_HOST,
            settings.RT_UN,
            settings.RT_PW,
            http_auth=HTTPBasicAuth(
                settings.RT_UN,
                settings.RT_PW
            )
        )

    def is_project_member(self):
        username = self.user.username
        tas_client = self.get_tas_client()
        project_users = tas_client.get_project_users(self.settings['project_sql_id'])
        return any([u['username'] == username for u in project_users])

    def send_project_request(self, request):
        tracker = self.get_tracker()
        ticket_text = 'User {username} is requesting membership on the {project} project. Please visit '
        ticket_text += '{onboarding_url} to complete this request.'
        ticket_text = ticket_text.format(
            username=self.user.username,
            project=self.project['title'],
            onboarding_url=request.build_absolute_uri(
                '/workbench/onboarding/setup/{username}'.format(
                    username=self.user.username
                )
            ),
        )

        try:
            if tracker.login():
                result = tracker.create_ticket(
                    Queue=self.settings.get('rt_queue') or 'Accounting',
                    Subject='{project} Project Membership Request for {username}'.format(
                        project=self.project['title'],
                        username=self.user.username
                    ),
                    Text=ticket_text,
                    Requestors=self.user.email,
                    CF_resource=settings.RT_TAG
                )
                tracker.logout()

                self.state = SetupState.STAFFWAIT
                self.log(
                    "Thank you for your request. It will be reviewed by TACC staff.",
                    data={
                        "ticket": result
                    }
                )
            else:
                raise Exception("Could not log in to RT")
        except Exception as err:
            logger.exception(msg="Could not create ticket on behalf of user during ProjectMembershipStep")
            logger.error(err.args)
            self.fail(
                "We were unable to submit a portal access request ticket on your behalf."
            )

    def add_to_project(self):
        tas_client = self.get_tas_client()
        # Project number is not the GID number, but the primary key
        # in the database for the project record.
        # When viewing a project in tas.tacc.utexas.edu, you should see "?id=xxxxx"
        # in the address bar. This is the SQL ID
        try:
            tas_client.add_project_user(self.settings['project_sql_id'], self.user.username)
        except Exception as e:
            error, reason = e.args
            if "is already a member" in reason:
                self.complete(
                    "{username} is already a member of the {project}".format(
                        username=self.user.username,
                        project=self.project['title']
                    )
                )
            else:
                self.fail(
                    "{username} could not be added to {project} due to error {reason}".format(
                        project=self.project['title'],
                        username=self.user.username,
                        reason=reason
                    )
                )
                raise e

    def deny_project_request(self):
        ticket_id = None
        for event in self.events:
            if event.data and "ticket" in event.data:
                ticket_id = event.data["ticket"]
        tracker = self.get_tracker()
        request_text = """Your request for membership on the {project} project has been
        denied. If you believe this is an error, please submit a help ticket.
        """.format(
            project=self.project['title']
        )
        if tracker.login():
            tracker.reply(ticket_id, text=request_text)
            tracker.comment(
                ticket_id,
                text="User was not added to the {project} TAS Project (GID {gid}) at {base_url}".format(
                    project=self.project['title'],
                    gid=self.project['gid'],
                    base_url=settings.WH_BASE_URL
                )
            )
            tracker.edit_ticket(ticket_id, Status='resolved')
        else:
            self.fail(
                "The portal was unable to close RT Ticket {ticket_id}".format(
                    ticket_id=ticket_id
                )
            )

    def close_project_request(self, deny=False):
        ticket_id = None
        for event in self.events:
            if event.data and "ticket" in event.data:
                ticket_id = event.data["ticket"]
        tracker = self.get_tracker()
        request_text = """Your request for membership on the {project} project has been
        granted. Please login at {base_url}/workbench/onboarding/setup to continue setting up your account.
        """.format(
            project=self.project['title'],
            base_url=settings.WH_BASE_URL
        )
        if tracker.login():
            tracker.reply(ticket_id, text=request_text)
            tracker.comment(
                ticket_id,
                text="User has been added to the {project} TAS Project (GID {gid}) via {base_url}".format(
                    project=self.project['title'],
                    gid=self.project['gid'],
                    base_url=settings.WH_BASE_URL
                )
            )
            tracker.edit_ticket(ticket_id, Status='resolved')
        else:
            self.fail(
                "The portal was unable to close RT Ticket {ticket_id}".format(
                    ticket_id=ticket_id
                )
            )

    def process(self):
        if self.is_project_member():
            self.complete("You have the required project membership to access this portal.")
        else:
            self.state = SetupState.USERWAIT
            data = None
            if self.settings is not None and 'userlink' in self.settings:
                data = {
                    'userlink': self.settings['userlink']
                }
            self.log(
                "Please confirm your request to use this portal.",
                data=data
            )

    def client_action(self, action, data, request):
        if action == "user_confirm":
            self.send_project_request(request)
            return

        if request.user.is_staff and action == "staff_approve":
            try:
                self.add_to_project()
                self.close_project_request()
                self.complete(
                    "Portal access request approved by {user}".format(
                        user=request.user.username
                    )
                )
            except Exception as err:
                logger.exception(msg="Error during staff_approve on {}".format(self.step_name()))
                logger.error(err.args)
                self.fail(
                    "An error occurred while trying to add this user to the project"
                )
        elif action == "staff_deny":
            self.deny_project_request()
            self.fail(
                "Portal access request has not been approved."
            )
        else:
            self.fail(
                "Invalid client action {action}".format(
                    action=action
                )
            )
