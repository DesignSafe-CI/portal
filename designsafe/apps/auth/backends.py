from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_out
from django.contrib import messages
from django.contrib.auth.backends import ModelBackend
from django.core.exceptions import ValidationError
from django.dispatch import receiver
from designsafe.apps.accounts.models import DesignSafeProfile, NotificationPreferences
from designsafe.apps.api.agave import get_service_account_client
from pytas.http import TASClient
import logging
import re
import requests
from requests.auth import HTTPBasicAuth


@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
    backend = request.session.get('_auth_user_backend', None)
    tas_backend_name = '%s.%s' % (TASBackend.__module__,
                                  TASBackend.__name__)
    agave_backend_name = '%s.%s' % (AgaveOAuthBackend.__module__,
                                    AgaveOAuthBackend.__name__)

    if backend == tas_backend_name:
        login_provider = 'TACC'
    elif backend == agave_backend_name:
        login_provider = 'TACC'
    else:
        login_provider = 'your authentication provider'

    logger = logging.getLogger(__name__)
    logger.debug("attempting call to revoke agave token function: %s", user.tapis_oauth.token)
    a = AgaveOAuthBackend()
    AgaveOAuthBackend.revoke(a,user.tapis_oauth)

    logout_message = '<h4>You are Logged Out!</h4>' \
                     'You are now logged out of DesignSafe! However, you may still ' \
                     'be logged in at %s. To ensure security, you should close your ' \
                     'browser to end all authenticated sessions.' % login_provider
    messages.warning(request, logout_message)


class TASBackend(ModelBackend):

    logger = logging.getLogger(__name__)

    def __init__(self):
        self.tas = TASClient()

    # Create an authentication method
    # This is called by the standard Django login procedure
    def authenticate(self, username=None, password=None, request=None, **kwargs):
        user = None
        if username is not None and password is not None:
            tas_user = None
            if request is not None:
                self.logger.info('Attempting login via TAS for user "%s" from IP "%s"' % (username, request.META.get('REMOTE_ADDR')))
            else:
                self.logger.info('Attempting login via TAS for user "%s" from IP "%s"' % (username, 'unknown'))
            try:
                # Check if this user is valid on the mail server
                if self.tas.authenticate(username, password):
                    tas_user = self.tas.get_user(username=username)
                    self.logger.info('Login successful for user "%s"' % username)
                else:
                    raise ValidationError('Authentication Error', 'Your username or password is incorrect.')
            except Exception as e:
                self.logger.warning(e.args)
                if re.search(r'PendingEmailConfirmation', e.args[1]):
                    raise ValidationError('Please confirm your email address before logging in.')
                else:
                    raise ValidationError(e.args[1])

            if tas_user is not None:
                UserModel = get_user_model()
                try:
                    # Check if the user exists in Django's local database
                    user = UserModel.objects.get(username=username)
                    user.first_name = tas_user['firstName']
                    user.last_name = tas_user['lastName']
                    user.email = tas_user['email']
                    user.save()

                except UserModel.DoesNotExist:
                    # Create a user in Django's local database
                    self.logger.info('Creating local user record for "%s" from TAS Profile' % username)
                    user = UserModel.objects.create_user(
                        username=username,
                        first_name=tas_user['firstName'],
                        last_name=tas_user['lastName'],
                        email=tas_user['email']
                        )
                try:
                    profile = DesignSafeProfile.objects.get(user=user)
                except DesignSafeProfile.DoesNotExist:
                    profile = DesignSafeProfile(user=user)
                    profile.save()

                try:
                    prefs = NotificationPreferences.objects.get(user=user)
                except NotificationPreferences.DoesNotExist:
                    prefs = NotificationPreferences(user=user)
                    prefs.save()

        return user


# class CILogonBackend(ModelBackend):

#     def authenticate(self, **kwargs):
#         return None


class AgaveOAuthBackend(ModelBackend):

    logger = logging.getLogger(__name__)

    def authenticate(self, *args, **kwargs):
        user = None

        if 'backend' in kwargs and kwargs['backend'] == 'agave':
            token = kwargs['token']
            base_url = getattr(settings, 'AGAVE_TENANT_BASEURL')

            self.logger.info('Attempting login via Agave with token "%s"' %
                             token[:8].ljust(len(token), '-'))

            # TODO make this into an AgavePy call
            response = requests.get('%s/profiles/v2/me' % base_url,
                                    headers={'Authorization': 'Bearer %s' % token})
            if response.status_code >= 200 and response.status_code <= 299:
                json_result = response.json()
                agave_user = json_result['result']
                username = agave_user['username']
                UserModel = get_user_model()
                try:
                    user = UserModel.objects.get(username=username)
                    user.first_name = agave_user['first_name']
                    user.last_name = agave_user['last_name']
                    user.email = agave_user['email']
                    user.save()
                except UserModel.DoesNotExist:
                    self.logger.info('Creating local user record for "%s" '
                                     'from Agave Profile' % username)
                    user = UserModel.objects.create_user(
                        username=username,
                        first_name=agave_user['first_name'],
                        last_name=agave_user['last_name'],
                        email=agave_user['email']
                        )

                try:
                    profile = DesignSafeProfile.objects.get(user=user)
                except DesignSafeProfile.DoesNotExist:
                    profile = DesignSafeProfile(user=user)
                    profile.save()

                try:
                    prefs = NotificationPreferences.objects.get(user=user)
                except NotificationPreferences.DoesNotExist:
                    prefs = NotificationPreferences(user=user)
                    prefs.save()

                self.logger.error('Login successful for user "%s"' % username)
            else:
                self.logger.error('Agave Authentication failed: %s' % response.text)
        return user

    def revoke(self, user):
        base_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
        self.logger.info("attempting to revoke agave token %s" % user.masked_token)
        response = requests.post('{base_url}/revoke'.format(base_url = base_url),
            auth=HTTPBasicAuth(settings.AGAVE_CLIENT_KEY, settings.AGAVE_CLIENT_SECRET),
            data={'token': user.access_token})
        self.logger.info("revoke response is %s" % response)
