from django.db import models
from django.conf import settings
from agavepy.agave import Agave
from agavepy import agave
from tapipy.tapis import Tapis
import logging
import six
import time
import requests
from requests import HTTPError
# from .signals import *
from designsafe.libs.common.decorators import deprecated

logger = logging.getLogger(__name__)


TOKEN_EXPIRY_THRESHOLD = 600


class TapisOAuthToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='tapis_oauth')
    access_token = models.CharField(max_length=255)
    refresh_token = models.CharField(max_length=255)
    expires_in = models.BigIntegerField()
    created = models.BigIntegerField()

    @property
    def masked_token(self):
        return self.access_token[:8].ljust(len(self.access_token), '-')

    @property
    def expired(self):
        current_time = time.time()
        return self.created + self.expires_in - current_time - TOKEN_EXPIRY_THRESHOLD <= 0

    @property
    def created_at(self):
        """
        Map the agavepy.Token property to model property
        :return: The Epoch timestamp this token was created
        """
        return self.created_at

    @created_at.setter
    def created_at(self, value):
        """
        Map the agavepy.Token property to model property
        :param value: The Epoch timestamp this token was created
        """
        self.created = value

    @property
    def token(self):
        return {
            'access_token': self.access_token,
            'refresh_token': self.refresh_token,
            'created': self.created,
            'expires_in': self.expires_in
        }

    @property
    def client(self):
        return Tapis(base_url=getattr(settings, 'TAPIS_TENANT_BASE_URL'),
                     client_id=getattr(settings, 'TAPIS_CLIENT_ID'),
                     client_key=getattr(settings, 'TAPIS_CLIENT_KEY'),
                     access_token=self.access_token,
                     refresh_token=self.refresh_token)

class AgaveServiceStatus(object):
    page_id = getattr(settings, 'AGAVE_STATUSIO_PAGE_ID', '53a1e022814a437c5a000781')
    status_io_base_url = getattr(settings, 'STATUSIO_BASE_URL',
                                 'https://api.status.io/1.0')
    status_overall = {}
    status = []
    incidents = []
    maintenance = {
        'active': [],
        'upcoming': [],
    }

    def __init__(self):
        self.update()

    def update(self):
        try:
            resp = requests.get('%s/status/%s' % (self.status_io_base_url, self.page_id))
            data = resp.json()
            if 'result' in data:
                for k, v, in six.iteritems(data['result']):
                    setattr(self, k, v)
            else:
                raise Exception(data)
        except HTTPError:
            logger.warning('Agave Service Status update failed')
