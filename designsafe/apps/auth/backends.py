from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.core.exceptions import ValidationError
from pytas.http import TASClient
import logging
import re
import requests


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
                self.logger.error(e.args)
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
            tenantBaseUrl = getattr(settings, 'AGAVE_TENANT_BASEURL')

            self.logger.info('Attempting login via Agave with token "%s"' %
                token[:8].ljust(len(token), '-'))

            response = requests.get('%s/profiles/v2/me' % tenantBaseUrl, headers={
                'Authorization': 'Bearer %s' % token
                })
            json_result = response.json()
            if 'status' in json_result and json_result['status'] == 'success':
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
                    self.logger.info('Creating local user record for "%s" from Agave Profile' % username)
                    user = UserModel.objects.create_user(
                        username=username,
                        first_name=agave_user['first_name'],
                        last_name=agave_user['last_name'],
                        email=agave_user['email']
                        )

                self.logger.info('Login successful for user "%s"' % username)
            else:
                self.logger.info('Agave Authentication failed: %s' % json_result)
        return user