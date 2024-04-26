"""
.. :module:: designsafe.apps.api.systems.views
   :synopsis: Systems views
"""

import logging
import json
from django.http import JsonResponse
from designsafe.apps.api.views import AuthenticatedApiView
from designsafe.utils.system_access import create_system_credentials
from designsafe.utils.encryption import createKeyPair
from .utils import add_pub_key_to_resource

logger = logging.getLogger(__name__)


class SystemKeysView(AuthenticatedApiView):
    """Systems View

    Main view for anything involving a system test
    """

    def post(self, request):
        """POST

        :param request: Django's request object
        :param str system_id: System id
        """
        body = json.loads(request.body)
        system_id = body["systemId"]

        logger.info(
            f"Resetting credentials for user {request.user.username} on system {system_id}"
        )
        (priv_key_str, publ_key_str) = createKeyPair()

        _, result, http_status = add_pub_key_to_resource(
            request.user,
            password=body["password"],
            token=body["token"],
            system_id=system_id,
            pub_key=publ_key_str,
            hostname=body["hostname"],
        )

        create_system_credentials(
            request.user.tapis_oauth.client,
            request.user.username,
            publ_key_str,
            priv_key_str,
            system_id,
        )

        return JsonResponse(
            {"systemId": system_id, "message": result}, status=http_status
        )
