"""Auth models
"""

import logging
import time
from django.db import models
from django.conf import settings
from tapipy.tapis import Tapis

logger = logging.getLogger(__name__)


TOKEN_EXPIRY_THRESHOLD = 600


class TapisOAuthToken(models.Model):
    """Represents an Tapis OAuth Token object.

    Use this class to store login details as well as refresh a token.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, related_name="tapis_oauth", on_delete=models.CASCADE
    )
    access_token = models.CharField(max_length=2048)
    refresh_token = models.CharField(max_length=2048)
    expires_in = models.BigIntegerField()
    created = models.BigIntegerField()

    @property
    def expired(self):
        """Check if token is expired

        :return: True or False, depending if the token is expired.
        :rtype: bool
        """
        return self.is_token_expired(self.created, self.expires_in)

    @property
    def created_at(self):
        """Map the tapipy.Token property to model property

        :return: The Epoch timestamp this token was created
        :rtype: int
        """
        return self.created_at

    @created_at.setter
    def created_at(self, value):
        """Map the tapipy.Token property to model property

        :param int value: The Epoch timestamp this token was created
        """
        self.created = value

    @property
    def token(self):
        """Token dictionary.

        :return: Full token object
        :rtype: dict
        """
        return {
            "access_token": self.access_token,
            "refresh_token": self.refresh_token,
            "created": self.created,
            "expires_in": self.expires_in,
        }

    @property
    def client(self):
        """Tapis client to limit one request to Tapis per User.

        :return: Tapis client using refresh token.
        :rtype: :class:Tapis
        """
        return Tapis(
            base_url=getattr(settings, "TAPIS_TENANT_BASEURL"),
            client_id=getattr(settings, "TAPIS_CLIENT_ID"),
            client_key=getattr(settings, "TAPIS_CLIENT_KEY"),
            access_token=self.access_token,
            refresh_token=self.refresh_token,
        )

    def update(self, **kwargs):
        """Bulk update model attributes"""
        for k, v in kwargs.items():
            setattr(self, k, v)
        self.save()

    def refresh_tokens(self):
        """Refresh and update Tapis OAuth Tokens"""
        self.client.refresh_tokens()
        self.update(
            created=int(time.time()),
            access_token=self.client.access_token.access_token,
            refresh_token=self.client.refresh_token.refresh_token,
            expires_in=self.client.access_token.expires_in().total_seconds(),
        )

    def __str__(self):
        access_token_masked = self.access_token[-5:]
        refresh_token_masked = self.refresh_token[-5:]
        return f"access_token:{access_token_masked} refresh_token:{refresh_token_masked} expires_in:{self.expires_in} created:{self.created}"

    @staticmethod
    def is_token_expired(created, expires_in):
        """Check if token is expired, with TOKEN_EXPIRY_THRESHOLD buffer."""
        current_time = time.time()
        return created + expires_in - current_time - TOKEN_EXPIRY_THRESHOLD <= 0

    @staticmethod
    def get_masked_token(token):
        """Return a token as a masked string"""
        return token[:8].ljust(len(token), "-")
