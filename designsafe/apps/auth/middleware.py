"""
Auth middleware
"""

import logging
from django.contrib.auth import logout
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.http import HttpResponseRedirect
from django.urls import reverse
from tapipy.errors import BaseTapyException
from designsafe.apps.auth.models import TapisOAuthToken

logger = logging.getLogger(__name__)


class TapisTokenRefreshMiddleware:
    """Refresh Middleware for a User's Tapis OAuth Token"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if (
            request.path != reverse("logout")
            and request.path != reverse("login")
            and not request.path.startswith("/static/")
            and request.user.is_authenticated
        ):
            self.process_request(request)

        response = self.get_response(request)
        return response

    def process_request(self, request):
        """Processes requests to backend and refreshes Tapis Token atomically if token is expired."""
        try:
            tapis_oauth = request.user.tapis_oauth
        except ObjectDoesNotExist:
            logger.warning(
                "Authenticated user missing Tapis OAuth Token",
                extra={"user": request.user.username},
            )
            logout(request)
            return HttpResponseRedirect(reverse("designsafe_auth:login"))

        if not tapis_oauth.expired:
            return

        logger.info(
            f"Tapis OAuth token expired for user {request.user.username}. Refreshing token"
        )
        with transaction.atomic():
            # Get a lock on this user's token row in db.
            latest_token = (
                TapisOAuthToken.objects.select_for_update()
                .filter(user=request.user)
                .first()
            )
            if latest_token.expired:
                try:
                    logger.info("Refreshing Tapis OAuth token")
                    tapis_oauth.refresh_tokens()
                except BaseTapyException:
                    logger.exception(
                        "Tapis Token refresh failed. Forcing logout",
                        extra={"user": request.user.username},
                    )
                    logout(request)
                    return HttpResponseRedirect(reverse("designsafe_auth:login"))

            else:
                logger.info(
                    "Token updated by another request. Refreshing token from DB."
                )
