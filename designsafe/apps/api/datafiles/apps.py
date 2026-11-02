from django.apps import AppConfig


class DataFilesAPIConfig(AppConfig):
    name = "designsafe.apps.api.datafiles"

    def ready(self):
        from . import diagnostics  # noqa: F401