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
    refresh_token = models.CharField(max_length=2048, blank=True, null=True)
    account_id = models.CharField(max_length=255)

    def update_tokens(self, access_token, refresh_token=None):
        """
        Callable method that should be passed as the store_tokens callable
        for the BoxDSK OAuth2 object.

        Args:
            access_token: the updated access token
            refresh_token: the updated refresh token (optional)

        Returns:
            None
        """
        self.access_token = access_token
        if refresh_token:
            self.refresh_token = refresh_token
        self.save()

    @property
    def client(self) -> Dropbox:
        """Returns a Dropbox client instance using the stored access token."""
        return Dropbox(
            self.access_token,
            oauth2_refresh_token=self.refresh_token,
            app_key=settings.DROPBOX_APP_KEY,
            app_secret=settings.DROPBOX_APP_SECRET,
        )

    def refresh_tokens(self):
        """
        Refreshes the access token using the refresh token.
        This method should be called when the access token is expired.
        """
        if not self.refresh_token:
            raise ValueError("No refresh token available to refresh access token.")

        if not self.client:
            raise ValueError("No Dropbox client available. Ensure access token is set.")

        self.client.refresh_access_token()

        self.update_tokens(
            self.client._oauth2_access_token, self.client._oauth2_refresh_token
        )
