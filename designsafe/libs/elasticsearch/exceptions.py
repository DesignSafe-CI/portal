"""
.. module: portal.libs.elasticsearch.exceptions
   :synopsis: Exceptions used when handling ES documents.
"""
from __future__ import unicode_literals, absolute_import

class ESException(Exception):
    """Custom exception base ES exception.

    .. rubric:: Rationale

    Elasticsearch DSL only uses ``TransportError`` to raise any type of errors.
    Some times we need to be a bit more specific to know how to handle
    the exception.
    """
    pass

class DocumentNotFound(ESException):
    """Document not found exception.

    .. note::

    When we are indexing files and a document is not found we can decide
    if we create it or fail.

    """
    pass
