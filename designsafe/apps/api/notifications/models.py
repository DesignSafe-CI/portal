from django.db import models
from designsafe.apps.signals.signals import generic_event
import datetime
import logging
import json

logger = logging.getLogger(__name__)

class BaseNotify(models.Model):
    event_type = models.CharField(max_length=50)
    datetime = models.DateTimeField(default=datetime.datetime.now, blank=True)
    status = models.CharField(max_length = 255)
    operation = models.charField(max_length = 255)
    message = models.TextField()
    extra = models.TextField()

    def to_dict(self):
        d = {
            'event_type': self.event_type,
            'datetime': self.datetime.strftime('%s'),
            'status': self.status,
            'operation': self.operation,
            'message': self.message,
            'extra': self.extra
        }

    class Meta:
        abstract = True

class Notification(BaseNotify):
    # what are the agave length defaults?
    user = models.CharField(max_length=20)
    read = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)

    @property
    def content(self):
        return json.loads(self.body)

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

    @property
    def content(self):
        return json.loads(self.body)

    def to_dict(self):
        event_data = super(Broadcast, self).to_dict()
        event_data.update({
            'group': self.group
        })
        return event_data
