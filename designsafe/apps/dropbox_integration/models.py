from dropbox import Dropbox
from django.conf import settings
from django.db import models


class DropboxUserToken(models.Model):
    """
    Represents an OAuth Token for a dropbox.com user
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="dropbox_user_token",
        on_delete=models.CASCADE,
    )
    dropbox_user_id = models.CharField(max_length=48)
    access_token = models.CharField(max_length=2048)
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
        self.save()

    @property
    def client(self):
        """Returns a Dropbox client instance using the stored access token."""
        return Dropbox(self.access_token)
