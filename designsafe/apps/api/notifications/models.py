from django.db import models
from django.db.models.signals import post_save
from designsafe.apps.signals.signals import generic_event
import datetime
import logging
import json

logger = logging.getLogger(__name__)

class BaseNotify(models.Model):
    event_type = models.CharField(max_length=50)
    datetime = models.DateTimeField(default=datetime.datetime.now, blank=True)
    body = models.TextField()

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
        event_data = {}
        event_data['event_type'] = self.event_type
        event_data['read'] = self.read
        event_data['deleted'] = self.deleted
        event_data['datetime'] = self.datetime.strftime('%s')
        event_data['body'] = self.body
        return event_data

class Broadcast(BaseNotify):
    group = models.CharField(max_length=20)

    @property
    def content(self):
        return json.loads(self.body)

    def to_dict(self):
        event_data = {}
        event_data['event_type'] = self.event_type
        event_data['datetime'] = self.datetime.strftime('%s')
        event_data['body'] = self.body
        return event_data

