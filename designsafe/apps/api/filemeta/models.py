"""File Meta model"""

from django.db import models, transaction
from django.db.models import Q
from django.utils import timezone


def _get_normalized_path(path: str) -> str:
    """ Return a file path that begins with /"

    For example, "file.jpg" becomes "/file.jpg"
    """
    if not path.startswith('/'):
        path = '/' + path
    path = path.replace('//', '/')
    return path


class FileMetaModel(models.Model):
    """Model for File Meta"""

    value = models.JSONField()  # 'path' and 'system' keys are always in value
    created = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(
                models.F(
                    "value__system"
                ),  # Functional index on 'system' within 'value'
                name="idx_value_system",
            ),
            models.Index(
                models.F("value__path"),  # Functional index on 'path' within 'value'
                name="idx_value_path",
            ),
        ]

    def __str__(self):
        return f"{self.value}"

    @classmethod
    def create_or_update_file_meta(cls, value):
        """
        Create or update a FileMetaModel instance based on the provided value dict containing 'system' and 'path'.

        Parameters:
        - value (dict): A dictionary containing file metadata including required 'system' and 'path'.

        Returns:
        - tuple (instance, created): The FileMetaModel instance and a boolean indicating if it was created (True) or updated (False).
        """
        system = value.get("system")
        path = _get_normalized_path(value.get("path"))
        value["path"] = path

        # Use a transaction to ensure atomicity
        with transaction.atomic():
            try:
                file_meta = FileMetaModel.objects.select_for_update().get(
                    Q(value__system=system) & Q(value__path=path)
                )
                file_meta.value = value
                file_meta.save()
                return file_meta, False
            except FileMetaModel.DoesNotExist:
                file_meta = FileMetaModel.objects.create(value=value)
                return file_meta, True

    @classmethod
    def get_by_path_and_system(cls, system, path):
        """
        Retrieve file metadata by 'system' and 'path'.

        Raises:
            - DoesNotExist: if file metadata entry not found
        """
        path = _get_normalized_path(path)
        return cls.objects.get(value__system=system, value__path=path)
