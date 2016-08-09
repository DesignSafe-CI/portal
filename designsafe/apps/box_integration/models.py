from boxsdk import Client, OAuth2
from django.db import models
from django.conf import settings
import json


class BoxUserToken(models.Model):
    """
    Represents an OAuth Token for a Box.com user
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='box_user_token')
    box_user_id = models.CharField(max_length=48)
    access_token = models.CharField(max_length=255)
    refresh_token = models.CharField(max_length=255)

    def update_tokens(self, access_token, refresh_token):
        """
        Callable method that should be passed as the store_tokens callable
        for the BoxDSK OAuth2 object.

        Args:
            access_token: the updated access token
            refresh_token: the updated refresh token

        Returns:
            None
        """
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.save()

    def get_token(self):
        """
        Convenience method to get current token.

        Returns:
            (access_token, refresh_token)

        """
        return self.access_token, self.refresh_token

    @property
    def client(self):
        oauth = OAuth2(client_id=settings.BOX_APP_CLIENT_ID,
                       client_secret=settings.BOX_APP_CLIENT_SECRET,
                       access_token=self.access_token,
                       refresh_token=self.refresh_token,
                       store_tokens=self.update_tokens)
        return Client(oauth)
