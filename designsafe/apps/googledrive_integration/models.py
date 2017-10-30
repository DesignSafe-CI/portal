from google.oauth2.credentials import Credentials
from googleapiclient import discovery
from django.conf import settings
from django.core.urlresolvers import reverse
from django.db import models
import json
import logging
import os
logger = logging.getLogger(__name__)

CLIENT_SECRETS_FILE = os.path.join(settings.SITE_DIR, 'client_secrets.json')

class GoogleDriveUserToken(models.Model):
    """
    Represents an OAuth Token for a Google Drive user
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='googledrive_user_token')
    token=models.CharField(max_length=255)
    refresh_token=models.CharField(max_length=255)
    token_uri=models.CharField(max_length=255)
    scopes=models.CharField(max_length=255)

    # def update_tokens(self, access_token):
    #     """
    #     Callable method that should be passed as the store_tokens callable
    #     for the BoxDSK OAuth2 object.

    #     Args:
    #         access_token: the updated access token

    #     Returns:
    #         None
    #     """
    #     self.access_token = access_token
    #     # self.refresh_token = refresh_token
    #     self.save()

    # def get_token(self):
    #     """
    #     Convenience method to get current token.

    #     Returns:
    #         (access_token, refresh_token)

    #     """
    #     return self.access_token, self.refresh_token

    @property
    def client(self):
        try:
            with open(CLIENT_SECRETS_FILE, 'r') as secrets_file:
                client_secrets = json.load(secrets_file)
                creds = {
                    'token': self.token,
                    'refresh_token': self.refresh_token,
                    'token_uri': self.token_uri,
                    'client_id': client_secrets['web']['client_id'],
                    'client_secret': client_secrets['web']['client_secret'],
                    'scopes': [self.scopes]}
        except IOError as e:
            logger.exception('No client_secrets.json file found! {}'.format(e))
        credentials = Credentials(**creds)
        drive = discovery.build('drive', 'v3', credentials=credentials)
        return drive
