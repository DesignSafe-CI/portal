from django.db import models
from designsafe.apps.signals.signals import generic_event
import datetime
import logging
import json

logger = logging.getLogger(__name__)

class BaseNotify(models.Model):
    """Abstract base notification class.

    These are the base fields that every notification should have.
    """
    event_type = models.CharField(max_length=50)
    datetime = models.DateTimeField(default=datetime.datetime.now, blank=True)
    #Status should be SUCCESS, INFO, ERROR, WARNING, 
    status = models.CharField(max_length = 255)
    operation = models.CharField(max_length = 255, default = '')
    message = models.TextField(default='')
    extra = models.TextField(default='')

    SUCCESS = GREEN = 'SUCCESS'
    INFO = BLUE = 'INFO'
    ERROR = RED = 'ERROR'
    WARNING = ORANGE = 'WARNING'
    EVENT_TYPE = 'event_type'
    STATUS = 'status'
    USER = USERNAME = 'user'
    EXTRA = CONTENT = 'extra'
    MESSAGE = 'message'
    OPERATION = 'operation'

    def to_dict(self):
        d = {
            'event_type': self.event_type,
            'datetime': self.datetime.strftime('%s'),
            'status': self.status,
            'operation': self.operation,
            'message': self.message,
            'extra': json.loads(self.extra)
        }
        return d

    def save(self, *args, **kwargs):
        if isinstance(self.extra, dict):
            self.extra = json.dumps(self.extra)

        super(BaseNotify, self).save(*args, **kwargs)
    
    @property
    def extra_content(self):
        return json.loads(self.extra)

    class Meta:
        abstract = True

class Notification(BaseNotify):
    # what are the agave length defaults?
    user = models.CharField(max_length=20)
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
