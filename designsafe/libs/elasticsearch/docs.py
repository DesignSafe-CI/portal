"""
.. module: portal.libs.elasticsearch.docs.base
   :synopsis: Wrapper classes for ES different doc types.
"""
from __future__ import unicode_literals, absolute_import
from future.utils import python_2_unicode_compatible
import logging
import json
from django.conf import settings
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import (Search, DocType, Date, Nested,
                               analyzer, Object, Text, Long,
                               InnerObjectWrapper, Boolean, Keyword,
                               GeoPoint, String)
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

@python_2_unicode_compatible
class File(DocType):
    name = Keyword(fields={
        '_exact': Keyword()
    })
    path = Text(fields={
        '_exact': Keyword(),
        '_path': Text(analyzer=path_analyzer),
        '_path_real': Text(analyzer=path_analyzer)
    })
    lastModified = Date()
    length = Long()
    format = String()
    mimeType = Keyword()
    type = String()
    system = String(fields={
        '_exact': Keyword()
    })
    systemId = String()
    lastUpdated = Date()

@python_2_unicode_compatible
class RapidNHEvent(DocType):
    created_date = Date()
    datasets = Nested(
        properties={
            'doi' : String(fields={
                '_exact':Keyword()
            }),
            'id' : String(fields={
                '_exact':Keyword()
            }),
            'title' : Text(analyzer='english'),
            'url' : String(fields={
                '_exact':Keyword()
            })
        }
    )
    event_data = Date()
    event_type = String(fields={
        '_exact':Keyword()
    })
    location = GeoPoint()
    location_description = Text(
        analyzer='english',
        fields={
            '_exact': Keyword()
        })
    main_image_url = String(fields={
        '_exact': Keyword()
    })
    main_image_uuid = String(fields={
        '_exact': Keyword()
    })
    title = Text(analyzer='english')

@python_2_unicode_compatible
class RapidNHEventType(DocType):
    display_name = String(fields={
        '_exact': Keyword()
    })
    name = String(fields={
        '_exact': Keyword()
    })

@python_2_unicode_compatible
class Publication(DocType):
    analysisList = Nested(
        properties={
            'associationIds' : String(multi=True, fields={'_exact':Keyword()}),
            'created': Date(),
            'doi': String(fields={'_exact':Keyword()}),
            'fileObjs': Nested({
                'lenght': Long(),
                'name': String(fields={'_exact':Keyword()}),
                'path': String(fields={'_exact': Keyword(),
                                       '_path': String(analyzer=path_analyzer)}),
            }),
            'lastUpdated': Date(),
            'name': String({'_exact':Keyword()}),
            'owner': String(),
            'uuid': String({'_exact':Keyword()}),
            'value': Nested({
            })
        })
    created = Date()
    eventsList = Nested()
    experimentsList = Nested()
    institutions = Nested()
    modelConfigs = Nested()
    project = Nested()
    projectId = Nested()
    reportsList = Nested()
    sensorLists = Nested()
    status = String()
    users = Nested()
