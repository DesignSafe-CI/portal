from boxsdk import OAuth2, Client
from boxsdk.exception import BoxOAuthException, BoxException
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import render
from designsafe.apps.box_integration.models import BoxUserToken
from designsafe.apps.box_integration.tasks import check_connection
import logging


logger = logging.getLogger(__name__)


@login_required
def index(request):
    context = {}
    try:
        BoxUserToken.objects.get(user=request.user)
        context["box_enabled"] = True
        try:
            box_user = check_connection(request.user.username)
            context["box_connection"] = box_user
        except BoxOAuthException:
            # authentication failed
            logger.warning(
                "Box oauth token for user=%s failed to authenticate"
                % request.user.username
            )
            context["box_connection"] = False
        except BoxException:
            # session layer exception
            logger.warning(
                "Box API error when testing oauth token for user=%s"
                % request.user.username
            )
            context["box_connection"] = False

    except BoxUserToken.DoesNotExist:
        logger.debug("BoxUserToken does not exist for user=%s" % request.user.username)

    return render(request, "designsafe/apps/box_integration/index.html", context)


@login_required
def initialize_token(request):
    oauth = OAuth2(
        client_id=settings.BOX_APP_CLIENT_ID,
        client_secret=settings.BOX_APP_CLIENT_SECRET,
    )
    redirect_uri = reverse("box_integration:oauth2_callback")
    logger.debug(request.build_absolute_uri(redirect_uri))
    auth_url, state = oauth.get_authorization_url(
        request.build_absolute_uri(redirect_uri)
    )
    request.session["box"] = {"state": state}
    return HttpResponseRedirect(auth_url)


@login_required
def oauth2_callback(request):
    auth_code = request.GET.get("code")
    state = request.GET.get("state")
    if "box" in request.session:
        box = request.session["box"]
    else:
        return HttpResponseBadRequest("Unexpected request")

    if not (state == box["state"]):
        return HttpResponseBadRequest("Request expired")

    try:
        oauth = OAuth2(
            client_id=settings.BOX_APP_CLIENT_ID,
            client_secret=settings.BOX_APP_CLIENT_SECRET,
        )
        access_token, refresh_token = oauth.authenticate(auth_code)
        client = Client(oauth)

        # save the token
        box_user = client.user(user_id="me").get()
        token = BoxUserToken(
            user=request.user,
            access_token=access_token,
            refresh_token=refresh_token,
            box_user_id=box_user.id,
        )
        token.save()
    except BoxException as e:
        logger.exception("Unable to complete Box integration setup: %s" % e)
        messages.error(
            request,
            "Oh no! An unexpected error occurred while trying to set "
            "up the Box.com application. Please try again.",
        )

    return HttpResponseRedirect(reverse("box_integration:index"))


@login_required
def disconnect(request):
    if request.method == "POST":
        logger.info("Disconnect Box.com requested by user...")
        try:
            box_user_token = request.user.box_user_token
            box_user_token.delete()
        except BoxUserToken.DoesNotExist:
            logger.warn(
                "Disconnect Box; BoxUserToken does not exist.",
                extra={"user": request.user},
            )
        except:
            logger.error(
                "Disconnect Box; BoxUserToken delete error.",
                extra={"user": request.user},
            )
        messages.success(
            request, "Your Box.com account has been disconnected from DesignSafe."
        )

        return HttpResponseRedirect(reverse("box_integration:index"))

    return render(request, "designsafe/apps/box_integration/disconnect.html")
