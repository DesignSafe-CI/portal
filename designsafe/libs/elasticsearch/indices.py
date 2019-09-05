"""
.. module: portal.libs.elasticsearch.docs.base
   :synopsis: Wrapper classes for ES different doc types.
"""
from future.utils import python_2_unicode_compatible
import logging
import json
import six
from importlib import import_module
from django.conf import settings
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import (Index)
from elasticsearch_dsl.query import Q
from elasticsearch import TransportError, ConnectionTimeout
from designsafe.libs.elasticsearch.analyzers import path_analyzer
from datetime import datetime

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

try:
    HOSTS = settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts']
    connections.configure(
        default={'hosts': HOSTS}
    )
except AttributeError as exc:
    logger.error('Missing ElasticSearch config. %s', exc)
    raise

"""
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
    try:
        index.create()
    except TransportError as err:
        if err.status_code == 404:
            logger.debug('Index already exists, initializing document')
    index.close()

    for document_config in index_config['documents']:
        module_str, class_str = document_config['class'].rsplit('.', 1)
        module = import_module(module_str)
        cls = getattr(module, class_str)
        index.doc_type(cls)
        cls.init()
    index.open()

    return index
"""

def setup_index(index_config, force=False, reindex=False):
    """
    Set up an index from a config dict. The behavior of the function is as follows:
     - If an index exists under the provided alias and force=False, just return
       the existing index.
     - If an index exists under the provided alias and force=True, then delete
       any indices under that alias and create a new index with that alias
       and the provided name.
     - If an index does not exist under the provided alias, then create a new
       index with that alias and the provided name.
    """
    alias = index_config['alias']
    if reindex:
        alias = alias + '_reindex'

    time_now = datetime.now().strftime("%Y_%m_%d_%H_%M_%S_%f")
    name = '{}_{}'.format(index_config['alias'], time_now)

    index = Index(alias)

    if force or not index.exists():
        # If an index exists under the alias and force=True, delete any indices
        # with that alias.
        while index.exists():
            index.delete(ignore=404)
            index = Index(alias)
        # Create a new index with the provided name.
        index = Index(name)
        # Alias this new index with the provided alias key.
        aliases = {alias: {}}
        index.aliases(**aliases)

        for document_config in index_config['documents']:
            module_str, class_str = document_config['class'].rsplit('.', 1)
            module = import_module(module_str)
            cls = getattr(module, class_str)
            index.doc_type(cls)

        index.create()

def init(name='all', force=False):
    if name != 'all':
        index_config = settings.ES_INDICES[name]
        setup_index(index_config, force)
    else:
        for index_name, index_config in six.iteritems(settings.ES_INDICES):
            logger.debug('initializing index: %s', index_name)
            setup_index(index_config, force)
