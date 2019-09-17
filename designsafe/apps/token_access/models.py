from django.db import models
from django.conf import settings
import binascii
import os


class Token(models.Model):
    """
    Represents an access token which can be used to access authenticated resources via
    header authentication, e.g., "Authorization: Token <token value>"
    """
    token = models.CharField(max_length=40, primary_key=True)
    nickname = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.deletion.CASCADE)
    created = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = Token.generate_token()
        return super(Token, self).save(*args, **kwargs)

    @staticmethod
    def generate_token():
        return binascii.hexlify(os.urandom(20)).decode()

    @property
    def header(self):
        return 'Token {0}'.format(self.token)

    def __unicode__(self):
        return self.token
