"""File Manager for community Data
"""

import logging
from future.utils import python_2_unicode_compatible
from designsafe.apps.api.agave.filemanager.agave import AgaveFileManager
from designsafe.apps.api.exceptions import ApiException

logger = logging.getLogger(__name__)


@python_2_unicode_compatible
class CommunityFileManager(AgaveFileManager):
    NAME = 'community'
    DEFAULT_SYSTEM_ID = 'designsafe.storage.community'

    @property
    def requires_auth(self):
        """Whether it should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return False

    def copy(self, *args, **kwargs):
        raise ApiException('Invalid action.', 400)

    def delete(self, *args, **kwargs):
        raise ApiException('Invalid action.', 400)

    def mkdir(self, *args, **kwargs):
        raise ApiException('Invalid action.', 400)

    def move(self, *args, **kwargs):
        raise ApiException('Invalid action.', 400)

    def rename(self, *args, **kwargs):
        raise ApiException('Invalid action.', 400)

    def share(self, *args, **kwargs):
        raise ApiException('Invalid action.', 400)

    def trash(self, *args, **kwargs):
        raise ApiException('Invalid action.', 400)

    def upload(self, *args, **kwargs):
        raise ApiException('Invalid action.', 400)
