"""
.. module: portal.libs.elasticsearch.docs.files
   :synopsis: Wrapper classes for ES ``files`` doc type.
"""

from future.utils import python_2_unicode_compatible
import logging
import os
import zipfile
from django.conf import settings
from designsafe.apps.data.models.elasticsearch import IndexedPublicationLegacy
from designsafe.libs.elasticsearch.docs.base import BaseESResource
from designsafe.libs.elasticsearch.exceptions import DocumentNotFound
from django.contrib.auth import get_user_model

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@python_2_unicode_compatible
class BaseESPublicationLegacy(BaseESResource):
    """Wrapper class for Elastic Search indexed NEES publication.

    .. rubric:: Rationale

    This wrapper class is needed in order to separate concerns.
    Any thing specific to Elastic Search must live in
    :mod:`libs.elasticsearch.docs.base` and any logic needed
    to manipulate data must live here.
    Also, by manipulating data outside a ``DocType`` subclass
    we avoid the use of ``AttrDict`` and ``AttrList``.

    """
    def __init__(self, wrapped_doc=None, nees_id=None, **kwargs):
        """Elastic Search File representation.

        This class directly wraps an Agave indexed file.

        """
        super(BaseESPublicationLegacy, self).__init__(wrapped_doc, **kwargs)

        if not wrapped_doc:
            self._populate(nees_id, **kwargs)

    def _populate(self, nees_id, **kwargs):

        try:
            wrapped_doc = self._index_cls.from_id(nees_id)
            self._wrap(wrapped_doc, **kwargs)
        except DocumentNotFound:
            self._wrapped = self._index_cls(project_id=nees_id,
                                            **dict(kwargs))
    @property
    def _index_cls(self):
        return IndexedPublicationLegacy


    def save(self, using=None, index=None, validate=True, **kwargs):
        """Save document
        """
        self._wrapped.save()

    def delete(self):
        self._wrapped.delete()

    def to_file(self):
        publication_dict = self.to_dict()

        project_dict = {}
        for key in ['deleted', 'description', 'endDate', 'facility', 'name', 
            'organization', 'pis', 'project', 'projectPath', 'publications',
            'startDate', 'system', 'title', 'sponsor']:
            
            if key in publication_dict:
                project_dict[key] = publication_dict[key]

        project_dict['systemId'] = publication_dict['system']

        experiments = []
        if 'experiments' in publication_dict:
            experiments = publication_dict['experiments']

        dict_obj = {'agavePath': 'agave://nees.public/{}'.\
                                 format(self.path),
                     'children': [],
                     'deleted': False,
                     'format': 'folder',
                     'length': 24731027,
                     'name': project_dict['name'],
                     'path': '/{}'.format(self.path),
                     'permissions': 'READ',
                     # project': project_dict['project'],
                     'system': project_dict['system'],
                     'systemId': project_dict['system'],
                     'type': 'dir',
                     'metadata': {
                         'experiments': experiments,
                         'project': project_dict
                     }}
                
        return dict_obj
