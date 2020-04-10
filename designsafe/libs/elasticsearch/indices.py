"""
.. module: portal.libs.elasticsearch.docs.base
   :synopsis: Wrapper classes for ES different doc types.
"""

import logging
import six
from importlib import import_module
from django.conf import settings
from elasticsearch_dsl import (Index)
from elasticsearch import Elasticsearch
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    HOSTS = settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts']
    es_client = Elasticsearch(HOSTS, http_auth=settings.ES_AUTH)
except AttributeError as exc:
    logger.error('Missing ElasticSearch config. %s', exc)
    raise


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
        alias += '-reindex'
    time_now = datetime.now().strftime("%Y_%m_%d_%H_%M_%S_%f")
    index_name = '{}-{}'.format(alias, time_now)

    index = Index(alias, using=es_client)

    if force or not index.exists():
        # If an index exists under the alias and force=True, delete any indices
        # with that alias.
        while index.exists():
            Index(list(index.get_alias().keys())[0]).delete(ignore=404)
            index = Index(alias)
        # Create a new index with the provided name.
        index = Index(index_name, using=es_client)
        # Alias this new index with the provided alias key.
        aliases = {alias: {}}
        index.aliases(**aliases)

        module_str, class_str = index_config['document'].rsplit('.', 1)
        module = import_module(module_str)
        cls = getattr(module, class_str)
        index.document(cls)
        index.settings(**index_config['kwargs'])

        index.create()


def init(name='all', force=False):
    if name != 'all':
        index_config = settings.ES_INDICES[name]
        setup_index(index_config, force)
    else:
        for index_name, index_config in six.iteritems(settings.ES_INDICES):
            logger.debug('initializing index: %s', index_name)
            setup_index(index_config, force)
