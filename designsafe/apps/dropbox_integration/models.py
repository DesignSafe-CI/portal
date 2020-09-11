from dropbox import DropboxOAuth2Flow, Dropbox
from django.conf import settings
from django.core.urlresolvers import reverse
from django.db import models
import json


class DropboxUserToken(models.Model):
    """
    Represents an OAuth Token for a dropbox.com user
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='dropbox_user_token')
    dropbox_user_id = models.CharField(max_length=48)
    access_token = models.CharField(max_length=255)
    account_id = models.CharField(max_length=255)

    def update_tokens(self, access_token):
        """
        Callable method that should be passed as the store_tokens callable
        for the BoxDSK OAuth2 object.

        Args:
            access_token: the updated access token

        Returns:
            None
        """
        self.access_token = access_token
        # self.refresh_token = refresh_token
        self.save()

    # def get_token(self):
    #     """
    #     Convenience method to get current token.

    #     Returns:
    #         (access_token, refresh_token)

    #     """
    #     return self.access_token, self.refresh_token

    @property
    def client(self, request):
        return Dropbox(self.access_token)