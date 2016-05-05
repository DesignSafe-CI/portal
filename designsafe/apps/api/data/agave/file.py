from agavepy.agave import AgaveException, Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.abstract.files import AbstractFile
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class AgaveFile(AbstractFile, AgaveObject):

    def __init__(self, **kwargs):
        super(AgaveFile, self).__init__(**kwargs)
        self._trail = None

    @property
    def parent_path(self):
        path, name = os.path.split(self.path)
        return path

    @property
    def id(self):
        return self.path

    @property
    def trail(self):
        if self._trail is None:
            self._trail = []
            if self.parent_path != '':
                path_parts = self.parent_path.split('/')
                for i, c in enumerate(path_parts):
                    self._trail.append({
                        'source': self.system,
                        'id': '/'.join(path_parts[:i]),
                        'name': c
                    })

        return self._trail

    @property
    def ext(self):
        return os.path.splitext(self.name)[1]

    def to_dict(self, **kwargs):
        return {
            'source': self.system,
            'id': self.id,
            'type': 'folder' if self.type == 'dir' else 'file',
            'path': self.parent_path,
            'name': self.name,
            'ext': self.ext,
            'size': self.length,
            'lastModified': datetime.strftime(self.lastModified, '%Y-%m-%dT%H:%M:%S%z'),
            '_trail': self.trail,
            '_actions': [],
            '_pems': [],
        }
