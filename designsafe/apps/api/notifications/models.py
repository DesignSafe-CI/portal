from django.db import models
from django.core.serializers.json import DjangoJSONEncoder
import datetime
import logging
import json
import six

logger = logging.getLogger(__name__)


class BaseNotify(models.Model):
    """Abstract base notification class.

    These are the base fields that every notification should have.
    """
    event_type = models.CharField(max_length=50)
    datetime = models.DateTimeField(default=datetime.datetime.now, blank=True)
    # Status should be SUCCESS, INFO, ERROR, WARNING,
    status = models.CharField(max_length=255)
    jobId = models.CharField(max_length=255, blank=True)
    operation = models.CharField(max_length=255, default='')
    message = models.TextField(default='')
    extra = models.TextField(default='')
    action_link = models.TextField(default='')

    SUCCESS = GREEN = 'SUCCESS'
    INFO = BLUE = 'INFO'
    ERROR = RED = 'ERROR'
    WARNING = ORANGE = 'WARNING'
    EVENT_TYPE = 'event_type'
    JOB_ID = 'jobId'
    STATUS = 'status'
    USER = USERNAME = 'user'
    EXTRA = CONTENT = 'extra'
    MESSAGE = 'message'
    OPERATION = 'operation'
    ACTION_LINK = 'action_link'

    def to_dict(self):
        try:
            extra = json.loads(self.extra)
        except ValueError:
            logger.debug('extra: %s, id: %s', self.extra, self.id)
            extra = {}
        d = {
            'event_type': self.event_type,
            'datetime': self.datetime.strftime('%s'),
            'status': self.status,
            'operation': self.operation,
            'message': self.message,
            'extra': extra,
            'pk': self.pk,
            'action_link': self.action_link
        }
        return d

    def save(self, *args, **kwargs):
        if isinstance(self.extra, dict):
            try:
                self.extra = json.dumps(self.extra, cls=DjangoJSONEncoder)
            except TypeError:
                for key in six.iterkeys(self.extra):
                    try:
                        json.dumps(self.extra[key])
                    except TypeError:
                        logger.debug('Keys with error: %s . Value: %s', key, self.extra[key])
                        raise

        super(BaseNotify, self).save(*args, **kwargs)

    @property
    def extra_content(self):
        return json.loads(self.extra)

    class Meta:
        abstract = True


class Notification(BaseNotify):
    # what are the agave length defaults?
    user = models.CharField(max_length=20, db_index=True)
    read = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)

    def mark_read(self):
        self.read = True
        self.save()

    def mark_deleted(self):
        self.deleted = True
        self.save()

    def to_dict(self):
        event_data = super(Notification, self).to_dict()
        event_data.update({
            'user': self.user,
            'read': self.read,
            'deleted': self.deleted
        })
        return event_data


class Broadcast(BaseNotify):
    group = models.CharField(max_length=20)

    def to_dict(self):
        event_data = super(Broadcast, self).to_dict()
        event_data.update({
            'group': self.group
        })
        return event_data
