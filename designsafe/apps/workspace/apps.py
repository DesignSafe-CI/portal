import logging
from django.apps import AppConfig

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name


class WorkspaceConfig(AppConfig):
    name = 'designsafe.apps.workspace'
    verbose_name = 'Designsafe workspace'

    def ready(self):
        pass
