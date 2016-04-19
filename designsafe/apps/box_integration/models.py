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


class BoxUserStreamPosition(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='box_stream_pos')
    box_user_id = models.CharField(max_length=48)
    stream_position = models.CharField(max_length=48, default='now')
    last_event_processed = models.CharField(max_length=48, blank=True)


class BoxUserEvent(models.Model):
    """
    An event in a users Box events stream. An individual event_id may be for multiple
    users, but each user should only have a single entry to each event_id.
    """
    event_id = models.CharField(max_length=48)
    event_type = models.CharField(max_length=48)
    created_at = models.DateTimeField()
    source = models.TextField()
    from_stream_position = models.CharField(max_length=48)
    processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(blank=True, null=True)
    retry = models.BooleanField(default=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='box_events')

    class Meta:
        unique_together = ('event_id', 'user')

    @property
    def source_dict(self):
        return json.loads(self.source)

    @source_dict.setter
    def source_dict(self, source):
        self.source = json.dumps(source)

    def __unicode__(self):
        return u'BoxUserEvent: {"event_id": "%s", "event_type": "%s", "user": "%s", ' \
               u'"from_stream_position": "%s", "source": %s}' % \
               (self.event_id, self.event_type, self.user.username,
                self.from_stream_position, self.source)

    def __str__(self):
        return unicode(self).encode('utf-8')
