from django.conf import settings
from django.db import models

class DataFilesSurveyResult(models.Model):
    project_id = models.CharField(max_length=255)
    comments = models.CharField(max_length=4096, blank=True, default='')
    reasons = models.CharField(max_length=4096)
    professional_level = models.CharField(max_length=255)
    did_collect = models.BooleanField()
    created = models.DateTimeField(auto_now_add=True)

class DataFilesSurveyCounter(models.Model):
    count = models.IntegerField()