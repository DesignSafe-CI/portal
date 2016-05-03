from agavepy.agave import AgaveException, Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.abstract.files import AbstractFile
import os
import logging
logger = logging.getLogger(__name__)

class AgaveFile(AbstractFile, AgaveObject):
    def __init__(self, resource, **kwargs):
        super(AgaveFile, self).__init__(**kwargs)
        self.resource = resource

    @property
    def parent_path(self):
        path, name = os.path.split(self.path)
        return path

    @property
    def id(self):
        return '{}/{}'.format(self.system, self.path) 

    def to_dict(self, **kwargs):
        return {
            'resource': self.resource,
            'actions': [],
            'pems': [],
            'name': self.name,
            'path': self.parent_path,
            'id': self.id,
            'size': self.length,
            'lastModified': self.lastModified,
        }
