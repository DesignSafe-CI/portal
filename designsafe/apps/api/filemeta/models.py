from django.db import models
from django.contrib.postgres.fields import JSONField


class FileMetaModel(models.Model):
    system = models.CharField(max_length=255)
    path = models.CharField(max_length=4096)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (('system', 'path'),)  # Enforces unique pairs of system and path and composite index


    def __str__(self):
        return f"{self.system} - {self.path}"
