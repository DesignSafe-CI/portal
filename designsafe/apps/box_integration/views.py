"""Box integration views for DesignSafe"""

import logging
from box_sdk_gen import (
    BoxClient,
    BoxOAuth,
    OAuthConfig,
    RequestException,
    GetAuthorizeUrlOptions,
    BoxSDKError
)
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import render
from designsafe.apps.box_integration.models import BoxUserToken


logger = logging.getLogger(__name__)


AUTH = BoxOAuth(
    OAuthConfig(
        client_id=settings.BOX_APP_CLIENT_ID,
        client_secret=settings.BOX_APP_CLIENT_SECRET,
    )
)


@login_required
def index(request):
    """Renders the Box integration page."""
    context = {}
    try:
        box_user_token = BoxUserToken.objects.get(user=request.user)
        context["box_enabled"] = True
        try:
            box_user = box_user_token.client.users.get_user_me()
            context["box_connection"] = box_user
        except (RequestException, BoxSDKError):
            logger.exception(
                "Box oauth token for user=%s failed to authenticate",
                request.user.username,
            )
            context["box_connection"] = False

    except BoxUserToken.DoesNotExist:
        logger.debug("BoxUserToken does not exist for user=%s", request.user.username)

    return render(request, "designsafe/apps/box_integration/index.html", context)


@login_required
def initialize_token(request):
    """Initializes the Box OAuth2 flow and redirects to the authorization URL."""
    redirect_uri = (
        f"https://{request.get_host()}{reverse('box_integration:oauth2_callback')}"
    )
    auth_url = AUTH.get_authorize_url(
        options=GetAuthorizeUrlOptions(redirect_uri=redirect_uri)
    )
    request.session["box"] = {}
    return HttpResponseRedirect(auth_url)


@login_required
def oauth2_callback(request):
    """Handles the OAuth2 callback from Box after user authentication."""
    try:
        AUTH.get_tokens_authorization_code_grant(request.GET.get("code"))
        client = BoxClient(auth=AUTH)

        # save the token
        box_user = client.users.get_user_me()
        box_token = AUTH.retrieve_token()
        logger.debug(box_token)
        logger.debug(box_token.access_token)
        logger.debug(box_token.refresh_token)
        token = BoxUserToken(
            user=request.user,
            access_token=box_token.access_token,
            refresh_token=box_token.refresh_token,
            box_user_id=box_user.id,
        )
        token.save()
    except (RequestException, BoxSDKError):
        logger.exception("Unable to complete Box integration setup")
        messages.error(
            request,
            "Oh no! An unexpected error occurred while trying to set "
            "up the Box.com application. Please try again.",
        )

    return HttpResponseRedirect(reverse("box_integration:index"))


@login_required
def disconnect(request):
    """Disconnects the Box integration for the user."""
    if request.method == "POST":
        logger.info("Disconnect Box.com requested by user...")
        try:
            box_user_token = request.user.box_user_token
            box_user_token.client.auth.revoke_token()
            box_user_token.delete()
        except BoxUserToken.DoesNotExist:
            logger.warning(
                "Disconnect Box; BoxUserToken does not exist.",
                extra={"user": request.user},
            )
        except (RequestException, BoxSDKError):
            logger.exception(
                "Disconnect Box; BoxUserToken delete error.",
                extra={"user": request.user},
            )
        messages.success(
            request, "Your Box.com account has been disconnected from DesignSafe."
        )

        return HttpResponseRedirect(reverse("box_integration:index"))

    return render(request, "designsafe/apps/box_integration/disconnect.html")
