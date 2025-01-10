"""System Access Step for Onboarding."""

import logging
import requests
from requests.exceptions import HTTPError
from django.conf import settings
from tapipy.errors import (
    NotFoundError,
    BaseTapyException,
    ForbiddenError,
    UnauthorizedError,
)
from designsafe.apps.onboarding.steps.abstract import AbstractStep
from designsafe.apps.onboarding.state import SetupState
from designsafe.utils.encryption import createKeyPair
from designsafe.apps.api.agave import get_service_account_client, get_tg458981_client
from designsafe.apps.api.tasks import agave_indexer
from designsafe.libs.common.decorators import retry


logger = logging.getLogger(__name__)


# retry for 5 minutes to account for allocation propagation
@retry(UnauthorizedError, tries=-1, max_time=5 * 60)
def create_system_credentials(  # pylint: disable=too-many-arguments
    client,
    username,
    public_key,
    private_key,
    system_id,
    skipCredentialCheck=False,  # pylint: disable=invalid-name
    **kwargs,
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


def create_path_and_permissions(system_id, path, username) -> None:
    """Create a path and set permissions for a user on a system."""

    tg458981_client = get_tg458981_client()

    # Create directory, resolves NotFoundError
    tg458981_client.files.mkdir(systemId=system_id, path=path)

    # Set ACLs, resolves UnauthorizedError and ForbiddenError
    tg458981_client.files.setFacl(
        systemId=system_id,
        path=path,
        operation="ADD",
        recursionMethod="PHYSICAL",
        aclString=f"d:u:{username}:rwX,u:{username}:rwX,d:u:tg458981:rwX,u:tg458981:rwX,d:o::---,o::---,d:m::rwX,m::rwX",
    )
    agave_indexer.apply_async(
        kwargs={"systemId": system_id, "filePath": path, "recurse": False},
        queue="indexing",
    )


class SystemAccessStepV3(AbstractStep):
    """System Access Step for Onboarding."""

    def display_name(self):
        return "Data Depot Setup Status"

    def description(self):
        return "Data Depot Setup will initiate automatically once the Initial Onboarding Status is Complete. When Data Depot Setup Status is Complete you will be able to access the Data Depot private storage areas which is also a prerequisite to utilizing the HPC-enabled tools and applications. Reply to the onboarding ticket if Initial Onboarding Status is Complete but Data Depot Setup doesn't change to Complete."

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting TACC systems access.")

    # retry for 5 minutes to account for setfacl and allocation propagation
    @retry(UnauthorizedError, tries=10, max_time=5 * 60)
    def check_system(self, system_id, path="/", **kwargs) -> None:
        """
        Check whether a user already has access to a storage system by attempting a listing.
        """
        self.user.tapis_oauth.client.files.listFiles(systemId=system_id, path=path)

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
                self.check_system(system, skip_retry=True)
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

        for system in self.settings.get("create_path_systems") or []:
            system_id = system["system_id"]
            path = system["path"].format(username=self.user.username)
            try:
                self.check_system(system_id, path, skip_retry=True)
                self.log(
                    f"Path and permissions already created for system: {system_id} and path: {path} for user: {self.user.username}"
                )
                continue
            except (NotFoundError, ForbiddenError, UnauthorizedError):
                logger.info(
                    "Ensuring directory exists for user=%s then going to run setfacl on system=%s path=%s",
                    self.user.username,
                    system_id,
                    path,
                )
                self.log(f"Creating directory tapis://{system_id}/{path} for user")

                create_path_and_permissions(system_id, path, self.user.username)

                # Check if the path with permissions was created successfully
                self.check_system(system_id, path)

            except BaseTapyException as exc:
                logger.error(exc)
                self.fail(
                    f"Failed to create path and permissions for system:{system} path:{path} for {self.user.username}"
                )

        if self.state != SetupState.FAILED:
            self.complete("User is processed.")
