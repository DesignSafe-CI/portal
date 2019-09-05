from django.db import models
from django.dispatch import receiver
from designsafe.apps.signals.signals import generic_event
from .apps import Event
import datetime
import json
import cgi


class Notification(models.Model):
    # what are the agave length defaults?
    event_type = models.CharField(max_length=50)
    user = models.CharField(max_length=20)
    read = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    notification_time = models.DateTimeField(default=datetime.datetime.now, blank=True)
    body = models.TextField()

    @property
    def content(self):
        return json.loads(self.body)

    def mark_read(self):
        self.read = True
        self.save()

    def mark_deleted(self):
        self.deleted = True
        self.save()


@receiver(generic_event)
def receive_notification(sender, **kwargs):
    event_type = kwargs.get('event_type')
    event_data = kwargs.get('event_data')
    event_users = kwargs.get('event_users')

    d = []
    if 'html' in event_data:
        for item in event_data['html']:
            for key, value in list(item.items()):
                if key != 'action_link':
                    key= cgi.escape(key)
                    value= cgi.escape(value)
                    d.append({key:value})

    event_data['html'] = d

    for user in event_users:
        notification = Notification(event_type=event_type, user=user,
                                    body=json.dumps(event_data))
        notification.save()

    Event.send_event(event_type, event_users, event_data)
