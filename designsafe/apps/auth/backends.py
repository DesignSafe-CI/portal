"""Auth backends"""

import logging
import re
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from tapipy.tapis import Tapis
from tapipy.errors import BaseTapyException
from designsafe.apps.accounts.models import DesignSafeProfile, NotificationPreferences
from designsafe.apps.api.users.utils import get_user_data
from designsafe.apps.auth.models import TapisOAuthToken
from django.contrib.auth.signals import user_logged_out
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.dispatch import receiver
from designsafe.apps.auth.tasks import update_institution_from_tas
from pytas.http import TASClient

logger = logging.getLogger(__name__)


@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
    "Signal processor for user_logged_out"
    backend = request.session.get("_auth_user_backend", None)
    tas_backend_name = "%s.%s" % (TASBackend.__module__, TASBackend.__name__)
    tapis_backend_name = "%s.%s" % (
        TapisOAuthBackend.__module__,
        TapisOAuthBackend.__name__,
    )

    if backend == tas_backend_name:
        login_provider = "TACC"
    elif backend == tapis_backend_name:
        login_provider = "TACC"

    logger.info(
        "Revoking tapis token: %s", TapisOAuthToken().get_masked_token(user.tapis_oauth.access_token)
    )
    backend = TapisOAuthBackend()
    TapisOAuthBackend.revoke(backend, user.tapis_oauth.access_token)

    logout_message = (
        "<h4>You are Logged Out!</h4>"
        "You are now logged out of DesignSafe! However, you may still "
        f"be logged in at {login_provider}. To ensure security, you should close your "
        "browser to end all authenticated sessions."
    )
    messages.warning(request, logout_message)


class TASBackend(ModelBackend):

    def __init__(self):
        self.tas = TASClient()

    # Create an authentication method
    # This is called by the standard Django login procedure
    def authenticate(self, request, username=None, password=None, **kwargs):
        user = None
        if username is not None and password is not None:
            tas_user = None
            if request is not None:
                self.logger.info(
                    'Attempting login via TAS for user "%s" from IP "%s"'
                    % (username, request.META.get("REMOTE_ADDR"))
                )
            else:
                self.logger.info(
                    'Attempting login via TAS for user "%s" from IP "%s"'
                    % (username, "unknown")
                )
            try:
                # Check if this user is valid on the mail server
                if self.tas.authenticate(username, password):
                    tas_user = self.tas.get_user(username=username)
                    self.logger.info('Login successful for user "%s"' % username)
                else:
                    raise ValidationError(
                        "Authentication Error",
                        "Your username or password is incorrect.",
                    )
            except Exception as e:
                self.logger.warning(e.args)
                if re.search(r"PendingEmailConfirmation", e.args[1]):
                    raise ValidationError(
                        "Please confirm your email address before logging in."
                    )
                else:
                    raise ValidationError(e.args[1])

            if tas_user is not None:
                UserModel = get_user_model()
                try:
                    # Check if the user exists in Django's local database
                    user = UserModel.objects.get(username=username)
                    user.first_name = tas_user["firstName"]
                    user.last_name = tas_user["lastName"]
                    user.email = tas_user["email"]
                    user.save()

                except UserModel.DoesNotExist:
                    # Create a user in Django's local database
                    self.logger.info(
                        'Creating local user record for "%s" from TAS Profile'
                        % username
                    )
                    user = UserModel.objects.create_user(
                        username=username,
                        first_name=tas_user["firstName"],
                        last_name=tas_user["lastName"],
                        email=tas_user["email"],
                    )
                try:
                    profile = DesignSafeProfile.objects.get(user=user)
                    profile.institution = tas_user.get("institution", None)
                    profile.save()
                except DesignSafeProfile.DoesNotExist:
                    profile = DesignSafeProfile(user=user)
                    profile.institution = tas_user.get("institution", None)
                    profile.save()

                try:
                    prefs = NotificationPreferences.objects.get(user=user)
                except NotificationPreferences.DoesNotExist:
                    prefs = NotificationPreferences(user=user)
                    prefs.save()

        return user


class TapisOAuthBackend(ModelBackend):

    def authenticate(self, *args, **kwargs):
        user = None

        if "backend" in kwargs and kwargs["backend"] == "tapis":
            token = kwargs["token"]

            logger.info(
                'Attempting login via Tapis with token "%s"' % TapisOAuthToken().get_masked_token(token)
            )
            client = Tapis(base_url=settings.TAPIS_TENANT_BASEURL, access_token=token)

            try:
                tapis_user_info = client.authenticator.get_userinfo()
            except BaseTapyException as e:
                logger.info("Tapis Authentication failed: %s", e.message)
                return None

            username = tapis_user_info.username

            try:
                user_data = get_user_data(username=username)
                defaults = {
                    "first_name": user_data["firstName"],
                    "last_name": user_data["lastName"],
                    "email": user_data["email"],
                }
            except Exception:
                logger.exception(
                    "Error retrieving TAS user profile data for user: %s", username
                )
                defaults = {
                    "first_name": tapis_user_info.given_name,
                    "last_name": tapis_user_info.last_name,
                    "email": tapis_user_info.email,
                }

            user, created = get_user_model().objects.update_or_create(
                username=username, defaults=defaults
            )

            if created:
                logger.info(
                    'Created local user record for "%s" from TAS Profile', username
                )

            DesignSafeProfile.objects.get_or_create(user=user)
            NotificationPreferences.objects.get_or_create(user=user)

            update_institution_from_tas.apply_async(args=[username], queue="api")

            logger.info('Login successful for user "%s"', username)

        return user

    def revoke(self, token):
        logger.info(
            "Attempting to revoke Tapis token %s" % TapisOAuthToken().get_masked_token(token)
        )

        client = Tapis(base_url=settings.TAPIS_TENANT_BASEURL, access_token=token)
        response = client.authenticator.revoke_token(token=token)
        logger.info("revoke response is %s" % response)
