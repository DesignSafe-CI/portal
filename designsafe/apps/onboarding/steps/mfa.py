from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from django.conf import settings
from requests.auth import HTTPBasicAuth
import requests


class MFAStep(AbstractStep):
    def __init__(self, user):
        super(MFAStep, self).__init__(user)
        self.user_confirm = "Confirm MFA Pairing"

    def display_name(self):
        return "Multi-Factor Authentication"

    def description(self):
        return """First, set up multi-factor authentication on the
                <a style="color:#9d85ef;" href="https://portal.tacc.utexas.edu">TACC User Portal</a>
                using the
                <a style="color:#9d85ef;" href="https://portal.tacc.utexas.edu/tutorials/multifactor-authentication#tacctokenapp">TACC Token App</a>,
                then confirm the pairing was successful."""

    def custom_status(self):
        if self.state == SetupState.COMPLETED:
            return "Confirmed"
        return None

    def prepare(self):
        self.state = SetupState.PENDING
        self.log(
            "Checking for a multi-factor authentication pairing",
        )

    def mfa_check(self):
        auth = HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
        response = requests.get(self.tas_pairings_url(), auth=auth)
        pairings = response.json()['result']
        return any(pairing['type'] == 'tacc-soft-token' for pairing in pairings)

    def process(self):
        if self.mfa_check():
            self.complete("Multi-factor authentication pairing verified")
        else:
            self.state = SetupState.USERWAIT
            self.log(
                """We were unable to verify your multi-factor authentication pairing. Please try again,
                then click the Confirm button.""",
            )

    def client_action(self, action, data, request):
        if action == "user_confirm" and request.user.username == self.user.username:
            self.prepare()

    def tas_pairings_url(self):
        return "{0}/tup/users/{1}/pairings".format(settings.TAS_URL, self.user.username)
