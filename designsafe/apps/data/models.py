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
from elasticsearch import TransportError
from designsafe.lib.elasticsearch.analyzers import path_analyzer

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

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
    dsMeta = Nested()

    class Meta:
        index = settings.ES_INDICES['files']['name']
        dynamic = MetaField('false')

@python_2_unicode_compatible
class Publication(DocType):
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

@python_2_unicode_compatible
class CMSRecord(DocType):
    body = Text(analyzer='english')
    description = Text(analyzer='english')
    django_id = String(fields={'_exact': Keyword()})
    language = String(analyzer='english')
    page_id = Long()
    pub_date = Date()
    site_id = Long()
    slug = String(analyzer='english', fields={'_exact': Keyword()})
    text = Text(analyser='english')
    title = String(analyzer='english', fields={'_exact': Keyword()})
    url = String(fields={'_exact': Keyword()})

@python_2_unicode_compatible
class NEESProject(DocType):
    description = Text(analyzer='english')
    endDate = Date()
    equipment = Nested()
    facility = Nested()
    fundorg = String(analyzer='english', fields={'_exact': Keyword()})
    fundorgprojid = String(fields={'_exact': Keyword()})
    name = String(fields={'_exact': Keyword()})
    organization = Nested()
    pis = Nested()
    project = String(fields={'_exact':Keyword()})
    projectPath = String(fields={'_exact':Keyword(), '_path':String(analyzer=path_analyzer)})
    publications = Nested()
    sponsor = Nested()
    startDate = Date()
    systemId = String(fields={'_exact':Keyword()})
    title = String(analyzer='english', fields={'_exact':Keyword()})
