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
class IndexedFile(DocType):
    name = Text(fields={
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
    dsMeta = Nested()
    permissions = Nested(properties={
        'username': Keyword(),
        'recursive': Boolean(),
        'permission': Nested(properties={
            'read': Boolean(),
            'write': Boolean(),
            'execute': Boolean()
        })
    })
    uuid = Keyword()

    class Meta:
        index = settings.ES_INDICES['files']['name']
        doc_type = settings.ES_INDICES['files']['documents'][0]['name']
        dynamic = MetaField('strict')

@python_2_unicode_compatible
class IndexedPublication(DocType):
    analysisList = Nested(properties={
        'associationIds' : String(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': String(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': String(fields={'_exact':Keyword()}),
            'path': String(fields={'_exact': Keyword(),
                                   '_path': String(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': String({'_exact':Keyword()}),
        'owner': String(),
        'uuid': String({'_exact':Keyword()}),
        'value': Nested(properties={
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english')
        })
    })
    created = Date()
    eventsList = Nested(properties={
        'associationIds' : String(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': String(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': String(fields={'_exact':Keyword()}),
            'path': String(fields={'_exact': Keyword(),
                                   '_path': String(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': String({'_exact':Keyword()}),
        'owner': String(),
        'uuid': String({'_exact':Keyword()}),
        'value': Nested(properties={
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english'),
            'experiments': String(multi=True, fields={'_exact':Keyword()}),
            'files': String(multi=True, fields={'_exact': Keyword()}),
            'modelConfigs': String(multi=True, fields={'_exact': Keyword()}),
            'project': String(fields={'_exact': Keyword()}),
            'sensorLists': String(multi=True, fields={'_exact': Keyword()}),
        })
    })
    experimentsList = Nested(properties={
        'associationIds' : String(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': String(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': String(fields={'_exact':Keyword()}),
            'path': String(fields={'_exact': Keyword(),
                                   '_path': String(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': String({'_exact':Keyword()}),
        'owner': String(),
        'uuid': String({'_exact':Keyword()}),
        'value': Nested(properties={
            'authors': String(multi=True, fields={'_exact': Keyword()}),
            'description': Text(analyzer='english'),
            'equipmentType': String(analyzer='english', fields={'_exact': Keyword()}),
            'equipmentTypeOther': String(analyzer='english', fields={'_exact': Keyword()}),
            'experimentalFacility': String(analyzer='english', fields={'_exact': Keyword()}),
            'experimentalFacilityOther': String(analyzer='english', fields={'_exact': Keyword()}),
            'title': Text(analyzer='english'),
            'project': String(fields={'_exact': Keyword()}),
        })
    })
    institutions = Nested(properties={
        'label': String(fields={'_exact': Keyword()}),
        'name': String(fields={'_exact': Keyword()})
    })
    modelConfigs = Nested(properties={
        'associationIds' : String(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': String(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': String(fields={'_exact':Keyword()}),
            'path': String(fields={'_exact': Keyword(),
                                   '_path': String(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': String({'_exact':Keyword()}),
        'owner': String(),
        'uuid': String({'_exact':Keyword()}),
        'value': Nested(properties={
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english'),
            'experiments': String(multi=True, fields={'_exact':Keyword()}),
            'files': String(multi=True, fields={'_exact': Keyword()}),
            'project': String(fields={'_exact': Keyword()}),
        })
    })
    project = Nested(properties={
        'associationIds' : String(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': String(fields={'_exact':Keyword()}),
        'lastUpdated': Date(),
        'name': String({'_exact':Keyword()}),
        'owner': String(),
        'uuid': String({'_exact':Keyword()}),
        'value': Nested(properties={
            'assocaitedProjects': Nested(properties={
                'href': String(fields={'_exact': Keyword()}),
                'title': String(fields={'_exact': Keyword()}, analyzer='english')
            }),
            'awardNumber': String(fields={'_exact': Keyword()}),
            'coPis': String(multi=True, fields={'_exact': Keyword()}),
            'teamMembers': String(multi=True, fields={'_exact': Keyword()}),
            'ef': String(analyzer='english', fields={'_exact': Keyword()}),
            'pi': String(fields={'_exact': Keyword()}),
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english'),
            'projectId': String(fields={'_exact': Keyword()}),
            'projectType': String(fields={'_exact': Keyword()}),
        })
    })
    projectId = String(fields={'_exact': Keyword()}),
    reportsList = Nested(properties={
        'associationIds' : String(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': String(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': String(fields={'_exact':Keyword()}),
            'path': String(fields={'_exact': Keyword(),
                                   '_path': String(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': String({'_exact':Keyword()}),
        'owner': String(),
        'uuid': String({'_exact':Keyword()}),
        'value': Nested(properties={
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english'),
            'experiments': String(multi=True, fields={'_exact':Keyword()}),
            'files': String(multi=True, fields={'_exact': Keyword()}),
            'project': String(fields={'_exact': Keyword()}),
        })
    })
    sensorLists = Nested(properties={
        'associationIds' : String(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': String(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': String(fields={'_exact':Keyword()}),
            'path': String(fields={'_exact': Keyword(),
                                   '_path': String(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': String({'_exact':Keyword()}),
        'owner': String(),
        'uuid': String({'_exact':Keyword()}),
        'value': Nested(properties={
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english'),
            'experiments': String(multi=True, fields={'_exact':Keyword()}),
            'modelConfigs': String(multi=True, fields={'_exact':Keyword()}),
            'sensorListType': String(multi=True, fields={'_exact':Keyword()}),
            'files': String(multi=True, fields={'_exact': Keyword()}),
            'project': String(fields={'_exact': Keyword()}),
        })
    })
    status = String()
    users = Nested(properties={
        'email': String(fields={'_exact': Keyword()}),
        'first_name': String(fields={'_exact': Keyword()}),
        'last_name': String(fields={'_exact': Keyword()}),
        'profile': Nested(properties={
            'institution': String(fields={'_exact': Keyword()}),
        }),
        'username': String(fields={'_exact': Keyword()}),
    })

    class Meta:
        index = settings.ES_INDICES['publications']['name']
        doc_type = settings.ES_INDICES['publications']['documents'][0]['name']

@python_2_unicode_compatible
class IndexedCMSPage(DocType):
    body = Text(analyzer='english')
    description = Text(analyzer='english')
    django_id = String(fields={'_exact': Keyword()})
    language = String(analyzer='english')
    page_id = Long()
    pub_date = Date()
    site_id = Long()
    slug = String(analyzer='english', fields={'_exact': Keyword()})
    text = Text(analyzer='english')
    title = String(analyzer='english', fields={'_exact': Keyword()})
    url = String(fields={'_exact': Keyword()})

    class Meta:
        index = settings.ES_INDICES['web_content']['name']
        doc_type = settings.ES_INDICES['web_content']['documents'][0]['name']
        dynamic = MetaField('strict')

@python_2_unicode_compatible
class IndexedPublicationLegacy(DocType):
    startDate = Date()
    endDate = Date()
    description = Text(analyzer='english')
    facility = Nested(
        properties={
            'country': Text(analyzer='english'),
            'name': Text(analyzer='english'),
            'state': Text(analyzer='english')
        })
    deleted = Boolean()
    path = String(fields={'_exact':Keyword(), '_path':String(analyzer=path_analyzer)})
    title = String(analyzer='english', fields={'_exact':Keyword()})
    name = String(fields={'_exact': Keyword()})
    equipment = Nested(
        properties={
            'component': Text(analyzer='english'),
            'equipment': Text(analyzer='english'),
            'equipmentClass': Text(analyzer='english'),
            'facility': Text(analyzer='english')
        })
    system = String(fields={'_exact':Keyword()})
    organization = Nested(
        properties={
            'country': Text(analyzer='english'),
            'name': String(analyzer='english'),
            'state': String(analyzer='english')
        })
    pis = Nested(
        properties={
            'lastName': String(analyzer='english'),
            'firstName': String(analyzer='english')
        })
    project = String(fields={'_exact':Keyword()})
    sponsor = Nested(
        properties={
            'name': String(analyzer='english'),
            'url': String()
        })
    fundorg = String(analyzer='english', fields={'_exact': Keyword()})
    fundorgprojid = String(fields={'_exact': Keyword()})
    publications = Nested(
        properties={
            'authors': String(analyzer='english', multi=True),
            'title': Text(analyzer='english')
        })
    experiments = Nested(
        properties={
            'startDate': Date(),
            'endDate': Date(),
            'doi': Keyword(),
            'description': Text(analyzer='english'),
            'facility': Nested(properties={
                'country': Text(analyzer='english'),
                'state': Text(analyzer='english'),
                'name': Text(analyzer='english'),
                }),
            'deleted': Boolean(),
            'path': String(fields={'_exact': Keyword(), '_path':String(analyzer=path_analyzer)}),
            'material': Nested(properties={
                'materials': String(analyzer='english', multi=True),
                'component': String(analyzer='english')
                }),
            'equipment': Nested(properties={
                'component': Text(analyzer='english'),
                'equipment': Text(analyzer='english'),
                'equipmentClass': Text(analyzer='english'),
                'facility': Text(analyzer='english')
            }),
            'title': Text(analyzer='english'),
            'sensors': String(analyzer='english', multi=True),
            'type': Text(analyzer='english'),
            'specimenType': Nested(properties={
                'name': Text(analyzer='english'),
                'description': Text(analyzer='english')
                }),
            'name': Text(analyzer='english'),
            'creators': Nested(properties={
                'lastName': Text(analyzer='english'),
                'firstName': Text(analyzer='english')
            })
        })

    class Meta:
        index = settings.ES_INDICES['publications_legacy']['name']
        doc_type = settings.ES_INDICES['publications_legacy']['documents'][0]['name']
        dynamic = MetaField('strict')
