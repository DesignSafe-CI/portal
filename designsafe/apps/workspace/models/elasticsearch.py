

import logging
import json
from django.conf import settings
from django.db import models
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import (Search, Document, Date, Nested,
                               analyzer, Object, Text, Long,
                               Boolean, Keyword,
                               GeoPoint, MetaField)
from elasticsearch_dsl.query import Q
from elasticsearch import TransportError
from designsafe.libs.elasticsearch.analyzers import path_analyzer
from designsafe.libs.elasticsearch.utils import get_sha256_hash, new_es_client

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name


class IndexedApp(Document):
    uuid = Text(fields={'_exact': Keyword()})
    schemaId = Text(fields={'_exact': Keyword()})
    internalUsername = Text(fields={'_exact': Keyword()})
    associationIds = Text(fields={'_exact': Keyword()}, multi=True)
    lastUpdated = Date()
    name = Text(fields={'_exact': Keyword()})
    created = Date()
    owner = Text(fields={'_exact': Keyword()})
    value = Nested(
        properties={
            'relations': Nested(properties={
                'type': Text(fields={'_exact': Keyword()}),
                'uuids': Text(fields={'_exact': Keyword()}, multi=True)
            }),
            'tags': Nested(properties={
                'name': Text(fields={'_exact': Keyword()}),
                'value': Text(fields={'_exact': Keyword()}, multi=True)
            }),
            'title': Text(analyzer='english'),
            'description': Text(analyzer='english')
        })

    class Index:
        name = settings.ES_INDICES['project_entities']['alias']

    class Meta:
        dynamic = MetaField('strict')
