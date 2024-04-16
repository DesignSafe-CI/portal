from django.db import models
from django.contrib.postgres.fields import JSONField
from django.utils import timezone


class FileMetaModel(models.Model):
    system = models.CharField(max_length=255)
    path = models.CharField(max_length=4096)
    value = models.JSONField()
    created = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (('system', 'path'),)  # Enforces unique pairs of system and path and composite index


    def __str__(self):
        return f"{self.system} - {self.path}"
