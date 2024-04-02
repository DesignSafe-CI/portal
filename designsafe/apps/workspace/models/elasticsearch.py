import logging
import json
from django.conf import settings
from django.db import models
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import (
    Search,
    DocType,
    Date,
    Nested,
    analyzer,
    Object,
    Text,
    Long,
    Boolean,
    Keyword,
    GeoPoint,
    MetaField,
)
from elasticsearch_dsl.query import Q
from elasticsearch import TransportError
from designsafe.libs.elasticsearch.analyzers import path_analyzer

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class IndexedApp(DocType):
    uuid = Text(fields={"_exact": Keyword()})
    schemaId = Text(fields={"_exact": Keyword()})
    internalUsername = Text(fields={"_exact": Keyword()})
    associationIds = Text(fields={"_exact": Keyword()}, multi=True)
    lastUpdated = Date()
    name = Text(fields={"_exact": Keyword()})
    created = Date()
    owner = Text(fields={"_exact": Keyword()})
    value = Nested(
        properties={
            "relations": Nested(
                properties={
                    "type": Text(fields={"_exact"}),
                    "uuids": Text(fields={"_exact"}, multi=True),
                }
            ),
            "tags": Nested(
                properties={
                    "name": Text(fields={"_exact"}),
                    "value": Text(fields={"_exact"}, multi=True),
                }
            ),
            "title": Text(analyzer="english"),
            "description": Text(analyzer="english"),
        }
    )

    class Index:
        name = settings.ES_INDICES["project_entities"]["alias"]

    class Meta:
        dynamic = MetaField("strict")
