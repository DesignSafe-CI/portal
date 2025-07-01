"""Views for Dropbox integration in DesignSafe."""

import logging
from dropbox.oauth import DropboxOAuth2Flow, BadRequestException, BadStateException
from dropbox.exceptions import AuthError
from dropbox import Dropbox
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from designsafe.apps.dropbox_integration.models import DropboxUserToken


logger = logging.getLogger(__name__)


@login_required
def index(request):
    """Renders the Dropbox integration page."""
    context = {}
    try:
        dropbox_token = DropboxUserToken.objects.get(user=request.user)
        context["dropbox_enabled"] = True
        try:
            dropbox = Dropbox(dropbox_token.access_token)
            dropbox_user = dropbox.users_get_account(dropbox_token.account_id)
            context["dropbox_connection"] = dropbox_user
        except (AuthError, BadRequestException):
            logger.warning(
                "Dropbox oauth token for user=%s failed to authenticate",
                request.user.username,
            )
            context["dropbox_connection"] = False

    except DropboxUserToken.DoesNotExist:
        logger.info(
            "DropboxUserToken does not exist for user=%s", request.user.username
        )

    return render(request, "designsafe/apps/dropbox_integration/index.html", context)


def get_dropbox_auth_flow(request):
    """Creates a Dropbox OAuth2 flow object for the user."""
    redirect_uri = (
        f"https://{request.get_host()}{reverse('dropbox_integration:oauth2_callback')}"
    )
    return DropboxOAuth2Flow(
        consumer_key=settings.DROPBOX_APP_KEY,
        consumer_secret=settings.DROPBOX_APP_SECRET,
        redirect_uri=request.build_absolute_uri(redirect_uri),
        session=request.session["dropbox"],
        csrf_token_session_key="state",
        token_access_type="offline",
    )


@csrf_exempt
@login_required
def initialize_token(request):
    """Initializes the Dropbox OAuth2 flow and redirects to Dropbox for authentication."""
    request.session["dropbox"] = {}
    auth_url = get_dropbox_auth_flow(request).start()
    return HttpResponseRedirect(auth_url)


@csrf_exempt
@login_required
def oauth2_callback(request):
    """Handles the OAuth2 callback from Dropbox."""
    try:
        logger.debug(f"request.GET: {request.GET}")
        oauth = get_dropbox_auth_flow(request).finish(request.GET.dict())
        logger.debug(f"oauth: {oauth}")
        token = DropboxUserToken(
            user=request.user,
            access_token=oauth.access_token,
            account_id=oauth.account_id,
            dropbox_user_id=oauth.user_id,
            refresh_token=oauth.refresh_token,
        )
        token.save()

    except BadStateException:
        HttpResponseRedirect(reverse("dropbox_integration:initialize_token"))

    except Exception:
        logger.exception("Unable to complete Dropbox integration setup")
        messages.error(
            request,
            "Oh no! An unexpected error occurred while trying to set "
            "up the Dropbox.com application. Please try again.",
        )

    return HttpResponseRedirect(reverse("dropbox_integration:index"))


@login_required
def disconnect(request):
    """Disconnects the user's Dropbox account from DesignSafe."""
    if request.method == "POST":
        logger.info("Disconnect Dropbox.com requested by user...")
        try:
            dropbox_token = DropboxUserToken.objects.get(user=request.user)
            dropbox = Dropbox(dropbox_token.access_token)
            dropbox.auth_token_revoke()

            dropbox_user_token = request.user.dropbox_user_token
            dropbox_user_token.delete()
        except AuthError:
            dropbox_user_token = request.user.dropbox_user_token
            dropbox_user_token.delete()
        except DropboxUserToken.DoesNotExist:
            logger.warning(
                "Disconnect Dropbox; DropboxUserToken does not exist.",
                extra={"user": request.user},
            )
        except Exception:
            logger.exception(
                "Disconnect Dropbox; DropboxUserToken delete error.",
                extra={"user": request.user},
            )

        messages.success(
            request, "Your Dropbox.com account has been disconnected from DesignSafe."
        )

        return HttpResponseRedirect(reverse("dropbox_integration:index"))

    return render(request, "designsafe/apps/dropbox_integration/disconnect.html")
