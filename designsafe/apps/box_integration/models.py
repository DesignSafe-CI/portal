"""Box Integration Models for Django Application"""

import logging
from typing import Optional
from box_sdk_gen import BoxClient, BoxOAuth, OAuthConfig, AccessToken, TokenStorage
from django.db import models
from django.conf import settings

logger = logging.getLogger(__name__)


class CustomTokenStorage(TokenStorage):
    """Custom token storage class that allows you to define how tokens are stored, retrieved, and cleared."""

    def __init__(self, store_callable=None, get_callable=None, clear_callable=None):
        """
        Custom token storage that allows you to define how tokens are stored,
        retrieved, and cleared.

        :param store_callable: Callable to store the token
        :param get_callable: Callable to retrieve the token
        :param clear_callable: Callable to clear the token
        """
        self._store_callable = store_callable
        self._get_callable = get_callable
        self._clear_callable = clear_callable

    def store(self, token: AccessToken) -> None:
        if self._store_callable:
            return self._store_callable(token)

    def get(self) -> Optional[AccessToken]:
        if self._get_callable:
            return self._get_callable()

    def clear(self) -> None:
        if self._clear_callable:
            return self._clear_callable()


class BoxUserToken(models.Model):
    """Represents an OAuth Token for a Box.com user"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="box_user_token",
        on_delete=models.CASCADE,
    )
    box_user_id = models.CharField(max_length=48)
    access_token = models.CharField(max_length=255)
    refresh_token = models.CharField(max_length=255)

    def update_tokens(self, token: AccessToken) -> None:
        """Callable method that should be passed as the `store` callable
        for the custom TokenStorage class."""
        if token.access_token and token.refresh_token:
            self.access_token = token.access_token
            self.refresh_token = token.refresh_token
            self.save()

    def get_tokens(self) -> Optional[AccessToken]:
        """Retrieve the access token and refresh token."""
        logger.debug(self.access_token)
        logger.debug(self.refresh_token)
        if self.access_token and self.refresh_token:
            return AccessToken(
                access_token=self.access_token, refresh_token=self.refresh_token
            )
        return None

    def clear_tokens(self) -> None:
        """Clear the stored access token and refresh token."""
        self.access_token = ""
        self.refresh_token = ""
        self.save()

    @property
    def client(self):
        """Returns a Box client instance using the stored access token."""
        custom_token_storage = CustomTokenStorage(
            store_callable=self.update_tokens,
            get_callable=self.get_tokens,
            clear_callable=self.clear_tokens,
        )
        auth = BoxOAuth(
            OAuthConfig(
                client_id=settings.BOX_APP_CLIENT_ID,
                client_secret=settings.BOX_APP_CLIENT_SECRET,
                token_storage=custom_token_storage,
            )
        )
        return BoxClient(auth=auth)
