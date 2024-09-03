"""
.. :module:: designsafe.apps.api.systems.views
   :synopsis: Systems views
"""

import logging
import json
from django.http import JsonResponse
from designsafe.apps.api.views import AuthenticatedApiView
from designsafe.apps.api.exceptions import ApiException
from designsafe.utils.system_access import create_system_credentials
from designsafe.utils.encryption import createKeyPair
from .utils import add_pub_key_to_resource, user_has_sms_pairing, send_sms_challenge

logger = logging.getLogger(__name__)


class SystemKeysView(AuthenticatedApiView):
    """View to handle system keys operations"""

    def post(self, request, operation):
        """POST

        :param request: Django's request object
        """
        username = request.user.username

        allowed_actions = ["push_keys", "check_and_send_sms_challenge"]
        if operation not in allowed_actions:
            raise ApiException(
                f"user: {username} is trying to run an unsupported job operation: {operation}",
                status=400,
            )

        op = getattr(self, operation)
        result, status = op(request)

        return JsonResponse(result, status=status)

    def push_keys(self, request):
        """Push ssh keypair to a system and create tapis system credentials"""
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

        return {"systemId": system_id, "message": result}, http_status

    def check_and_send_sms_challenge(self, request):
        """Check if user has sms pairing and send sms challenge"""
        username = request.user.username
        if user_has_sms_pairing(username):
            result, status = send_sms_challenge(username)

        return {"message": result or "OK"}, status or 200
