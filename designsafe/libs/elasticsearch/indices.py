"""
.. module: portal.libs.elasticsearch.docs.base
   :synopsis: Wrapper classes for ES different doc types.
"""
from __future__ import unicode_literals, absolute_import
from future.utils import python_2_unicode_compatible
import logging
import json
import six
from importlib import import_module
from django.conf import settings
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import (Index)
from elasticsearch_dsl.query import Q
from elasticsearch import TransportError
from designsafe.lib.elasticsearch.analyzers import path_analyzer

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

try:
    DEFAULT_INDEX = settings.ES_DEFAULT_INDEX
    HOSTS = settings.ES_HOSTS
    FILES_DOC_TYPE = settings.ES_FILES_DOC_TYPE
    connections.configure(
        default={'hosts': HOSTS}
    )
except AttributeError as exc:
    logger.error('Missing ElasticSearch config. %s', exc)
    raise

def _init_index(index_config, force):
    index = Index(index_config['name'])
    aliases = {}
    for alias_val in index_config['alias']:
        if isinstance(alias_val, basestring):
            aliases[alias_val] = {}
        else:
            aliases[alias_val['name']] = alias_val['config']
    index.aliases(**aliases)
    if force:
        index.delete(ignore=404)
    
    index.create()
    for document_config in index_config['documents']:
        module_str, class_str = document_config['class'].rsplit('.', 1)
        module = import_module(module_str)
        cls = getattr(module, class_str)
        index.doc_type(cls)
        cls.init()

    return index

def init(name='all', force=False):
    if name != 'all':
        index_config = settings.ES_INDICES[name]
        _init_index(index_config, force)
    else:
        for index_name, index_config in six.iteritems(settings.ES_INDICES):
            _init_index(index_config, force)
