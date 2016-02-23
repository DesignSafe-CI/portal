from django.db import models
import datetime
import json


class Notification(models.Model):
    event_type = models.CharField(max_length=50) #what are the agave length defaults
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
