from oauth2client.contrib.django_util.models import CredentialsField
from google.auth.transport.requests import Request
from googleapiclient import discovery
from django.conf import settings
from django.db import models
import logging
import os

logger = logging.getLogger(__name__)

CLIENT_SECRETS_FILE = os.path.join(settings.SITE_DIR, 'client_secrets.json')


class GoogleDriveUserToken(models.Model):
    """
    Represents an OAuth Token for a Google Drive user
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='googledrive_user_token')
    credential = CredentialsField()

    @property
    def client(self):
        if not self.credential.valid:
            request = Request()
            self.credential.refresh(request)
        drive = discovery.build('drive', 'v3', credentials=self.credential)
        return drive
