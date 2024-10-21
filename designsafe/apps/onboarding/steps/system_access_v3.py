"""System Access Step for Onboarding."""

import logging
import requests
from requests.exceptions import HTTPError
from django.conf import settings
from tapipy.errors import BaseTapyException
from designsafe.apps.onboarding.steps.abstract import AbstractStep
from designsafe.apps.onboarding.state import SetupState
from designsafe.utils.encryption import createKeyPair
from designsafe.apps.api.agave import get_service_account_client


logger = logging.getLogger(__name__)


def create_system_credentials(  # pylint: disable=too-many-arguments
    client,
    username,
    public_key,
    private_key,
    system_id,
    skipCredentialCheck=False,  # pylint: disable=invalid-name
) -> int:
    """
    Set an RSA key pair as the user's auth credential on a Tapis system.
    """
    logger.info(f"Creating user credential for {username} on Tapis system {system_id}")
    data = {"privateKey": private_key, "publicKey": public_key}
    client.systems.createUserCredential(
        systemId=system_id,
        userName=username,
        skipCredentialCheck=skipCredentialCheck,
        **data,
    )


def register_public_key(
    username, publicKey, system_id  # pylint: disable=invalid-name
) -> int:
    """
    Push a public key to the Key Service API.
    """
    url = "https://api.tacc.utexas.edu/keys/v2/" + username
    headers = {"Authorization": f"Bearer {settings.KEY_SERVICE_TOKEN}"}
    data = {"key_value": publicKey, "tags": [{"name": "system", "value": system_id}]}
    response = requests.post(url, json=data, headers=headers, timeout=60)
    response.raise_for_status()
    return response.status_code


def set_user_permissions(user, system_id):
    """Apply read/write/execute permissions to files and read permissions on the system."""
    logger.info(f"Adding {user.username} permissions to Tapis system {system_id}")
    client = get_service_account_client()
    client.systems.grantUserPerms(
        systemId=system_id, userName=user.username, permissions=["READ"]
    )
    client.files.grantPermissions(
        systemId=system_id, path="/", username=user.username, permission="MODIFY"
    )


class SystemAccessStepV3(AbstractStep):
    """System Access Step for Onboarding."""

    def display_name(self):
        return "System Access"

    def description(self):
        return "Setting up access to TACC storage and execution systems. No action required."

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting TACC systems access.")

    def check_system(self, system_id) -> None:
        """
        Check whether a user already has access to a storage system by attempting a listing.
        """
        self.user.tapis_oauth.client.files.listFiles(systemId=system_id, path="/")

    def process(self):
        self.log(f"Processing system access for user {self.user.username}")
        for system in self.settings.get("access_systems") or []:
            try:
                set_user_permissions(self.user, system)
                self.log(f"Successfully granted permissions for system: {system}")
            except BaseTapyException as exc:
                logger.error(exc)
                self.fail(f"Failed to grant permissions for system: {system}")

        for system in self.settings.get("credentials_systems") or []:
            try:
                self.check_system(system)
                self.log(f"Credentials already created for system: {system}")
                continue
            except BaseTapyException:
                self.log(f"Creating credentials for system: {system}")

            (priv, pub) = createKeyPair()

            try:
                register_public_key(self.user.username, pub, system)
                self.log(f"Successfully registered public key for system: {system}")
            except HTTPError as exc:
                logger.error(exc)
                self.fail(
                    f"Failed to register public key with key service for system: {system}"
                )

            try:
                create_system_credentials(
                    self.user.tapis_oauth.client, self.user.username, pub, priv, system
                )
                self.log(f"Successfully created credentials for system: {system}")
            except BaseTapyException as exc:
                logger.error(exc)
                self.fail(f"Failed to create credentials for system: {system}")

        if self.state != SetupState.FAILED:
            self.complete("User is processed.")
