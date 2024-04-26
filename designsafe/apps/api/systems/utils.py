"""
.. :module:: apps.accounts.managers.accounts
   :synopsis: Manager handling anything pertaining to accounts
"""

import logging
from paramiko.ssh_exception import (
    AuthenticationException,
    ChannelException,
    SSHException,
)
from .ssh_keys_manager import KeysManager, KeyCannotBeAdded


logger = logging.getLogger(__name__)


def add_pub_key_to_resource(
    user,
    password,
    token,
    system_id,
    pub_key,
    hostname=None,
    port=22,
):
    """Add Public Key to Remote Resource

    :param user: Django User object
    :param str password: Username's pasword to remote resource
    :param str token: TACC's token
    :param str system_id: Tapis system's id
    :param str hostname: Resource's hostname
    :param int port: Port to use for ssh connection

    :raises: :class:`~portal.apps.accounts.managers.`

    """
    success = True
    mgr = KeysManager(user, password, token)
    message = "add_pub_key_to_resource"

    logger.info(f"Adding public key for user {user.username} on system {system_id}")
    try:
        if hostname is None:
            sys = user.tapis_oauth.client.systems.getSystem(systemId=system_id)
            hostname = sys.host

        transport = mgr.get_transport(hostname, port)
        message = mgr.add_public_key(
            system_id, hostname, pub_key, port=port, transport=transport
        )
        status = 200
    except Exception as base_exc:
        # Catch all exceptions and set a status code for unknown exceptions
        success = False
        message = str(base_exc)
        logger.exception(
            message,
            extra={"user": user.username},
        )

        try:
            # "Re-throw" exception to get known exception type status codes
            raise base_exc
        except AuthenticationException:
            # Bad password/token
            status = 403  # Forbidden
        except KeyCannotBeAdded:
            # May occur when system is down
            message = "KeyCannotBeAdded"  # KeyCannnotBeAdded exception does not contain a message?
            status = 503
        except (ChannelException, SSHException) as exc:
            # cannot ssh to system
            message = str(
                type(exc)
            )  # paramiko exceptions do not contain a string message?
            status = 500  # Bad gateway

    return success, message, status
