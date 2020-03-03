"""
.. module: portal.libs.elasticsearch.docs.files
   :synopsis: Wrapper classes for ES ``files`` doc type.
"""

from future.utils import python_2_unicode_compatible
import logging
import os
from django.conf import settings
from designsafe.apps.data.models.elasticsearch import IndexedFile
from designsafe.libs.elasticsearch.docs.base import BaseESResource
from designsafe.libs.elasticsearch.exceptions import DocumentNotFound

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@python_2_unicode_compatible
class BaseESFile(BaseESResource):
    """Wrapper class for Elastic Search indexed file.

    .. rubric:: Rationale

    This wrapper class is needed in order to separate concerns.
    Any thing specific to Elastic Search must live in
    :mod:`libs.elasticsearch.docs.base` and any logic needed
    to manipulate data must live here.
    Also, by manipulating data outside a ``DocType`` subclass
    we avoid the use of ``AttrDict`` and ``AttrList``.

    """
    def __init__(self, username, system=settings.AGAVE_STORAGE_SYSTEM,
                 path='/', wrapped_doc=None, reindex=False, **kwargs):
        """Elastic Search File representation.

        This class directly wraps an Agave indexed file.

        """
        super(BaseESFile, self).__init__(wrapped_doc, **kwargs)
        self.username = username
        self._reindex = reindex

        if not wrapped_doc:
            self._populate(system, path, **kwargs)

    def _populate(self, system, path, **kwargs):

        try:
            self._wrapped = self._index_cls(self._reindex).from_path(system, path)
        except DocumentNotFound:
            self._wrapped = self._index_cls(self._reindex)(system=system,
                                            path=path,
                                            **dict(kwargs))
    @classmethod
    def _index_cls(cls, reindex):
        return IndexedFile
        #if reindex:
        #    return ReindexedFile
        #else:
        #    return IndexedFile

    def children(self, limit=100):
        """
        Yield all children (i.e. documents whose basePath matches self.path) by 
        paginating with the search_after api.

        """
        res, search_after = self._index_cls(self._reindex).children(
                                                self.username,
                                                self.system,
                                                self.path, 
                                                limit=limit)
        for doc in res:
                yield BaseESFile(self.username, wrapped_doc=doc)

        while not len(res) < limit: # If the number or results doesn't match the limit, we're done paginating.
            # Retrieve the sort key from the last element then use  
            # search_after to get the next page of results
            res, search_after = self._index_cls(self._reindex).children(
                                                self.username,
                                                self.system,
                                                self.path, 
                                                limit=limit,
                                                search_after=search_after)
            for doc in res:
                yield BaseESFile(self.username, wrapped_doc=doc)

    def save(self, using=None, index=None, validate=True, **kwargs):
        """Save document
        """
        self._wrapped.save()

    def delete(self):
        """Overwriting to implement delete recursively.
        .. seealso:
            Module :class:`elasticsearch_dsl.document.DocType`

        """
        if self.format == 'folder':
            children = self.children()
            for child in children:
                if child.path != self.path:
                    child.delete()
        self._wrapped.delete()