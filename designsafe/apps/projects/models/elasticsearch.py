from __future__ import unicode_literals, absolute_import
from future.utils import python_2_unicode_compatible
import logging
import json
from django.conf import settings
from django.db import models
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import (Search, DocType, Date, Nested,
                               analyzer, Object, Text, Long,
                               InnerObjectWrapper, Boolean, Keyword,
                               GeoPoint, String, MetaField)
from elasticsearch_dsl.query import Q
from elasticsearch import TransportError, ConnectionTimeout
from designsafe.libs.elasticsearch.analyzers import path_analyzer

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@python_2_unicode_compatible
class IndexedProject(DocType):
    uuid = Text(fields={'_exact': Keyword()})
    schemaId = Text(fields={'_exact': Keyword()})
    internalUsername = Text(fields={'_exact': Keyword()})
    associationIds = Text(fields={'_exact': Keyword()}, multi=True)
    lastUpdated = Date()
    name = Text(fields={'_exact': Keyword()})
    created = Date()
    owner = Text(fields={'_exact': Keyword()})
    value = Object(
        properties={
            'teamMembers': Text(fields={'_exact': Keyword()}, multi=True),
            'guestMembers': Nested(properties={
                'guest': Boolean(),
                'lname': Text(fields={'_exact': Keyword()}),
                'inst': Text(),
                'user': Keyword(),
                'fname': Text(fields={'_exact': Keyword()}),
                'email': Text(fields={'_exact': Keyword()}),
                'order': Long()
            }, multi=True),
            'teamOrder': Nested(properties={
                'guest': Boolean(),
                'name': Text(fields={'_exact': Keyword()}),
                'lname': Text(fields={'_exact': Keyword()}),
                'inst': Text(),
                'user': Keyword(),
                'fname': Text(fields={'_exact': Keyword()}),
                'email': Text(fields={'_exact': Keyword()}),
                'order': Long()
            }, multi=True),
            'fileTags': Nested(properties={
                'fileUuid': Keyword(),
                'tagName': Keyword(),
                'format': Keyword(),
                'lastModified': Date(),

            }, multi=True),

            'nhEventStart': Date(),
            'nhEventEnd': Date(),
            'nhTypes': Text(fields={'_exact': Keyword()}),
            'nhEvent': Text(fields={'_exact': Keyword()}),

            'coPis': Text(fields={'_exact': Keyword()}, multi=True),
            'projectType': Text(fields={'_exact': Keyword()}, analyzer='english'),
            'description': Text(analyzer='english'),
            'projectId': Text(fields={'_exact': Keyword()}),
            'dataType': Text(fields={'_exact': Keyword()}),
            'title': Text(analyzer='english'),
            'keywords': Text(analyzer='english'),
            'ef': Text(analyzer='english'),
            'associatedProjects': Nested(properties={
                'title': Text(analyzer='english'),
                'href': Text(fields={'_exact':Keyword()}),
                'delete': Boolean()
            }),
            'pi': Text(fields={'_exact': Keyword()}),
            'awardNumber': Nested(properties={
                'number': Keyword(),
                'name': Text(fields={'_exact': Keyword()}),
            }, multi=True),
        })

    class Meta:
        index = settings.ES_INDICES['projects']['alias']
        doc_type = settings.ES_INDICES['projects']['documents'][0]['name']
        dynamic = MetaField('strict')

@python_2_unicode_compatible
class IndexedEntity(DocType):
    uuid = String(fields={'_exact': Keyword()})
    schemaId = String(fields={'_exact': Keyword()})
    internalUsername = String(fields={'_exact': Keyword()})
    associationIds = String(fields={'_exact': Keyword()}, multi=True)
    lastUpdated = Date()
    name = String(fields={'_exact': Keyword()})
    created = Date()
    owner = String(fields={'_exact': Keyword()})
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

    class Meta:
        index = settings.ES_INDICES['project_entities']['name']
        doc_type = settings.ES_INDICES['project_entities']['documents'][0]['name']
        dynamic = MetaField('strict')
