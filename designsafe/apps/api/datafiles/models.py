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


class PublicationSymlink(models.Model):
    """
    Maps a symlink (by its Tapis accessor) to its target type (file or directory).
    Fields:
        tapis_accessor (str): Unique Tapis path for the symlink (e.g. 'tapis://system/path').
        type (str): Target type, either 'file' or 'dir'.
    """

    tapis_accessor = models.CharField(
        max_length=512, primary_key=True
    )  # tapis://<system>/<path>
    type = models.CharField(
        max_length=255, choices=[("file", "File"), ("dir", "Directory")]
    )

    def __str__(self):
        return f"{self.tapis_accessor} -> {self.type}"