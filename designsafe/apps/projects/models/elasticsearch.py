from __future__ import unicode_literals, absolute_import
from future.utils import python_2_unicode_compatible
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
from elasticsearch import TransportError, ConnectionTimeout
from designsafe.libs.elasticsearch.analyzers import path_analyzer

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@python_2_unicode_compatible
class IndexedProject(Document):
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
            # 'authors': Text(analyzer='english', multi=True),
            'teamMembers': Text(fields={'_exact': Keyword()}, multi=True),
            'teamMember': Text(fields={'_exact': Keyword()}, multi=True),
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
                'path': Text(fields={'_exact': Keyword()})

            }, multi=True),
            
            'nhEventStart': Date(),
            'nhEventEnd': Date(),
            'nhTypes': Text(fields={'_exact': Keyword()}),
            'nhType': Text(fields={'_exact': Keyword()}),   
            'nhTypeOther': Text(fields={'_exact': Keyword()}),
            'nhEvent': Text(fields={'_exact': Keyword()}),
            'nhLocation': Text(fields={'_exact': Keyword()}),
            'nhLatitude': Text(fields={'_exact': Keyword()}),
            'nhLongitude': Text(fields={'_exact': Keyword()}),
            'fr_types': Text(fields={'_exact': Keyword()}, multi=True),
            'coPis': Text(fields={'_exact': Keyword()}, multi=True),
            'projectType': Text(fields={'_exact': Keyword()}, analyzer='english'),
            'description': Text(analyzer='english'),
            'projectId': Text(fields={'_exact': Keyword()}),
            'dataType': Text(fields={'_exact': Keyword()}),
            'title': Text(analyzer='english'),
            'keywords': Text(analyzer='english'),
            'ef': Text(analyzer='english'),
            # 'referencedData': Text(fields={'_exact': Keyword()}, analyzer='english', multi=True),
            # 'relatedFiles': Text(fields={'_exact': Keyword()}),
            'associatedProjects': Nested(properties={
                'title': Text(analyzer='english'),
                'href': Text(fields={'_exact':Keyword()}),
                'order': Long(),
                'delete': Boolean(),
                'type': Text(fields={'_exact':Keyword()}),
                'hrefType': Text(fields={'_exact':Keyword()}),
            }),
            'pi': Text(fields={'_exact': Keyword()}),
            'awardNumber': Nested(properties={
                'number': Keyword(),
                'name': Text(fields={'_exact': Keyword()}),
                'order': Long(),
            }, multi=True),
            'awardNumbers': Nested(properties={
                'number': Keyword(),
                'name': Text(fields={'_exact': Keyword()}),
                'order': Long(),
            }, multi=True),
            'dois': Text(fields={'_exact': Keyword()}, multi=True),
            'hazmapperMaps': Nested(properties={
                'name': Text(fields={'_exact':Keyword()}),
                'path': Text(fields={'_exact':Keyword()}),
                'uuid': Text(fields={'_exact':Keyword()}),
                'deployment': Text(fields={'_exact':Keyword()}),
                # 'href': Text(fields={'_exact':Keyword()})
            }),
            # 'users': Text(fields={'_exact': Keyword()}, multi=True)
        })

    class Index:
        name = settings.ES_INDICES['projects']['alias'] 

    class Meta:
        dynamic = MetaField('strict')

@python_2_unicode_compatible
class IndexedEntity(Document):
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
