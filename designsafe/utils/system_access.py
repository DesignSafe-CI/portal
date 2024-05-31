"""
.. :module:: designsafe.utils.system_access
   :synopsis: Utilities to register keys with key service and with Tapis
"""
import logging
import requests
from django.conf import settings


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
