from django.db import models
import datetime

class Notification(models.Model):
    event = models.CharField(max_length=50) #what are the agave length defaults
    user = models.CharField(max_length=20)
    read = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    notification_time = models.DateTimeField(default=datetime.datetime.now, blank=True)

    class Meta:
        abstract = True

class JobNotification(Notification):
    # type = models.CharField(default='job', max_length=20)
    job_name = models.CharField(max_length=100)
    job_id = models.CharField(max_length=40)
    status = models.CharField(max_length=50)
