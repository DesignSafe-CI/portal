"""
Auth views.
"""

import logging
import time
import secrets
import requests
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.urls import reverse
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import render
from designsafe.apps.auth.tasks import (
    check_or_configure_system_and_user_directory,
    get_systems_to_configure,
)
from designsafe.apps.workspace.api.tasks import cache_allocations
from designsafe.apps.auth.tasks import new_user_alert
from .models import TapisOAuthToken

logger = logging.getLogger(__name__)
METRICS = logging.getLogger(f"metrics.{__name__}")


def logged_out(request):
    """Render logged out page upon logout"""
    return render(request, "designsafe/apps/auth/logged_out.html")


def _get_auth_state():
    return secrets.token_hex(24)


def tapis_oauth(request):
    """First step for Tapis OAuth workflow."""
    session = request.session
    session["auth_state"] = _get_auth_state()
    next_page = request.GET.get("next")
    if next_page:
        session["next"] = next_page

    if request.is_secure():
        protocol = "https"
    else:
        protocol = "http"

    redirect_uri = f"{protocol}://{request.get_host()}{reverse('designsafe_auth:tapis_oauth_callback')}"
    if request.get_host() == "designsafe-ci.org":
        redirect_uri = redirect_uri.replace(
            "designsafe-ci.org", "www.designsafe-ci.org"
        )

    tenant_base_url = getattr(settings, "TAPIS_TENANT_BASEURL")
    client_id = getattr(settings, "TAPIS_CLIENT_ID")

    METRICS.debug(f"user:{request.user.username} starting oauth redirect login")

    # Authorization code request
    authorization_url = (
        f"{tenant_base_url}/v3/oauth2/authorize?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        "response_type=code&"
        f"state={session['auth_state']}"
    )

    return HttpResponseRedirect(authorization_url)


def launch_setup_checks(user):
    """Perform any onboarding checks or non-onboarding steps that may spawn celery tasks"""
    logger.info("Starting tasks to check or configure systems for %s", user.username)
    for system in get_systems_to_configure(user.username):
        check_or_configure_system_and_user_directory.apply_async(
            args=(
                user.username,
                system["system_id"],
                system["path"],
                system["create_path"],
            ),
            queue="files",
        )
    logger.info("Creating/updating cached allocation information for %s", user.username)
    cache_allocations.apply_async(args=(user.username,))


def tapis_oauth_callback(request):
    """Tapis OAuth callback handler."""
    state = request.GET.get("state")

    if request.session["auth_state"] != state:
        msg = f"OAuth Authorization State mismatch: auth_state={request.session['auth_state']} does not match returned state={state}"

        logger.warning(msg)
        return HttpResponseBadRequest("Authorization State Failed")

    if "code" in request.GET:
        # obtain a token for the user
        if request.is_secure():
            protocol = "https"
        else:
            protocol = "http"
        redirect_uri = f"{protocol}://{request.get_host()}{reverse('designsafe_auth:tapis_oauth_callback')}"
        if request.get_host() == "designsafe-ci.org":
            redirect_uri = redirect_uri.replace(
                "designsafe-ci.org", "www.designsafe-ci.org"
            )
        code = request.GET["code"]

        body = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
        response = requests.post(
            f"{settings.TAPIS_TENANT_BASEURL}/v3/oauth2/tokens",
            data=body,
            auth=(settings.TAPIS_CLIENT_ID, settings.TAPIS_CLIENT_KEY),
            timeout=30,
        )
        response_json = response.json()
        token_data = {
            "created": int(time.time()),
            "access_token": response_json["result"]["access_token"]["access_token"],
            "refresh_token": response_json["result"]["refresh_token"]["refresh_token"],
            "expires_in": response_json["result"]["access_token"]["expires_in"],
        }

        # log user in
        user = authenticate(backend="tapis", token=token_data["access_token"])

        if user:
            _, created = TapisOAuthToken.objects.update_or_create(user=user, defaults={**token_data})
            if created:
                new_user_alert.apply_async(args=(user.username,))

            login(request, user)
            launch_setup_checks(user)
        else:
            messages.error(
                request,
                "Authentication failed. Please try again. If this problem "
                "persists please submit a support ticket.",
            )
            return HttpResponseRedirect(reverse("logout"))
    else:
        if "error" in request.GET:
            error = request.GET["error"]
            logger.warning("Authorization failed: %s", error)

        return HttpResponseRedirect(reverse("logout"))

    if "next" in request.session:
        next_uri = request.session.pop("next")
        return HttpResponseRedirect(next_uri)

    return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
