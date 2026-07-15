"""Compatibility helpers for the unmaintained djangocms-forms package."""

from django.core.files import storage
from django.utils.module_loading import import_string


def apply_storage_compatibility():
    """Restore the storage loader removed in Django 5 for djangocms-forms."""
    if not hasattr(storage, "get_storage_class"):
        storage.get_storage_class = import_string
