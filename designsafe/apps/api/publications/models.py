"""
Django model for storing symlink metadata for published Tapis files.
This table is used to resolve the actual type (file or dir) of symbolic links
in the published data system, since Tapis cannot always determine the target type.
"""
from django.db import models

class PublicationSymlink(models.Model):
    """
    Maps a symlink (by its Tapis accessor) to its target type (file or directory).

    Fields:
        tapis_accessor (str): Unique Tapis path for the symlink (e.g. 'tapis://system/path').
        type (str): Target type, either 'file' or 'dir'.
    """
    tapis_accessor = models.CharField(max_length=512, primary_key=True)  # tapis://<system>/<path>
    type = models.CharField(max_length=4, choices=[('file', 'File'), ('dir', 'Directory')])

    def __str__(self):
        return f"{self.tapis_accessor} -> {self.type}"
