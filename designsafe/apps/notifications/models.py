from django.db import models
import datetime

class Notification(models.Model):
    event_type = models.CharField(max_length=50) #what are the agave length defaults
    user = models.CharField(max_length=20)
    read = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    notification_time = models.DateTimeField(default=datetime.datetime.now, blank=True)
    body = models.TextField()
