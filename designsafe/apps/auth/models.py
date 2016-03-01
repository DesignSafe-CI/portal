from django.db import models
from django.conf import settings
from agavepy.agave import Agave
import logging
import six
import time
import requests
from requests import HTTPError

from .signals import *


logger = logging.getLogger(__name__)


class AgaveOAuthToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='agave_oauth')
    token_type = models.CharField(max_length=255)
    scope = models.CharField(max_length=255)
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
        return self.created + self.expires_in - current_time - 600 <= 0

    @property
    def token(self):
        return {
            'access_token': self.access_token,
            'refresh_token': self.refresh_token,
            'token_type': self.token_type,
            'scope': self.scope,
            'created': self.created,
            'expires_in': self.expires_in
        }

    def update(self, **kwargs):
        for k, v in six.iteritems(kwargs):
            setattr(self, k, v)

    def refresh(self):
        logger.debug('Refreshing Agave OAuth token for user=%s' % self.user.username)
        ag = Agave(api_server=getattr(settings, 'AGAVE_TENANT_BASEURL'),
                   api_key=getattr(settings, 'AGAVE_CLIENT_KEY'),
                   api_secret=getattr(settings, 'AGAVE_CLIENT_SECRET'),
                   token=self.access_token,
                   refresh_token=self.refresh_token)
        current_time = time.time()
        ag.token.refresh()
        self.created = int(current_time)
        self.update(**ag.token.token_info)
        self.save()
        logger.debug('Agave OAuth token for user=%s refreshed: %s' % (self.user.username,
                                                                      self.masked_token))


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
            logger.exception('Agave Service Status update failed')
