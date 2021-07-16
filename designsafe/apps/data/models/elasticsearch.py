
from future.utils import python_2_unicode_compatible
import logging
import json
from django.conf import settings
from django.db import models
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import (Search, Document, Date, Nested,
                               analyzer, Object, Text, Long,
                               Boolean, Keyword,
                               GeoPoint, MetaField, Index)
from elasticsearch_dsl.query import Q
from elasticsearch import TransportError, ConnectionTimeout
from designsafe.libs.elasticsearch.analyzers import path_analyzer, file_analyzer, file_pattern_analyzer, reverse_file_analyzer
from designsafe.libs.elasticsearch.exceptions import DocumentNotFound

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@python_2_unicode_compatible
class IndexedFile(Document):
    name = Text(analyzer=file_analyzer, fields={
        '_exact': Keyword(),
        '_pattern': Text(analyzer=file_pattern_analyzer),
        '_reverse': Text(analyzer=reverse_file_analyzer)
    })
    path = Text(fields={
        '_exact': Keyword(),
        '_path': Text(analyzer=path_analyzer)
    })
    lastModified = Date()
    length = Long()
    format = Text()
    mimeType = Keyword()
    type = Text()
    system = Text(fields={
        '_exact': Keyword()
    })
    systemId = Text()
    basePath=Text(fields={ '_exact': Keyword() })
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

    @classmethod
    def _pems_filter(self):
        term_username_query = Q(
            'term',
            **{'permissions.username': self.username}
        )
        term_world_query = Q(
            'term',
            **{'permissions.username': 'WORLD'}
        )
        bool_query = Q('bool')
        bool_query.should = [term_username_query, term_world_query]
        nested_query = Q('nested')
        nested_query.path = 'permissions'
        nested_query.query = bool_query
        return nested_query

    @classmethod
    def from_path(cls, system, path):
        Index(settings.ES_INDICES['files']['alias']).refresh()
        search = cls.search()
        sys_filter = Q('term', **{'system._exact': system})
        path_filter = Q('term', **{'path._exact': path})
        search = search.filter(sys_filter & path_filter)
        try:
            res = search.execute()
        except Exception as exc:
            raise exc
        if res.hits.total.value > 1:
            id_filter = Q('term', **{'_id': res[0].meta.id}) 
            # Delete all files indexed with the same system/path, except the first result
            delete_query = sys_filter & path_filter & ~id_filter
            cls.search().filter(delete_query).delete()
            return cls.get(res[0].meta.id)
        elif res.hits.total.value == 1:
            return cls.get(res[0].meta.id)
        else:
            raise DocumentNotFound("No document found for "
                                   "{}/{}".format(system, path))

    @classmethod
    def children(cls, username, system, path, limit=100, search_after=None):
        search = cls.search()
        # search = search.filter(cls._pems_filter(username))
        search = search.filter('term', **{'basePath._exact': path})
        search = search.filter('term', **{'system._exact': system})
        search = search.sort('_id')
        search = search.extra(size=limit)
        if search_after:
            search = search.extra(search_after=search_after)
        try:
            res = search.execute()
        except TransportError:
            raise TransportError
        if len(res.hits) > 0:
            wrapped_children = [cls.get(doc.meta.id) for doc in res]
            sort_key = res.hits.hits[-1]['sort']
            return wrapped_children, sort_key
        else:
            return [], None

    class Index:
        name = settings.ES_INDICES['files']['alias']
    class Meta:
        dynamic = MetaField('strict')

    
class IndexedFileLegacy(Document):
    name = Text(analyzer=file_analyzer, fields={
        '_exact': Keyword(),
        '_pattern': Text(analyzer=file_pattern_analyzer),
        '_reverse': Text(analyzer=reverse_file_analyzer)
    })
    path = Text(fields={
        '_exact': Keyword(),
        '_path': Text(analyzer=path_analyzer)
    })
    deleted = Boolean()
    length = Long()
    format = Keyword()
    type = Keyword()
    systemId = Keyword()

    class Index:
        name = settings.ES_INDICES['files_legacy']['alias']
    class Meta:
        dynamic = MetaField('strict')

@python_2_unicode_compatible
class IndexedPublication(Document):
    revision = Long()
    revisionText = Text()
    revisionDate = Date()
    analysisList = Nested(properties={
        'associationIds' : Text(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': Text(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': Text(fields={'_exact':Keyword()}),
            'path': Text(fields={'_exact': Keyword(),
                                   '_path': Text(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': Text({'_exact':Keyword()}),
        'owner': Text(),
        'uuid': Text({'_exact':Keyword()}),
        'value': Nested(properties={
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english')
        })
    })
    created = Date()
    eventsList = Nested(properties={
        'associationIds' : Text(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': Text(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': Text(fields={'_exact':Keyword()}),
            'path': Text(fields={'_exact': Keyword(),
                                   '_path': Text(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': Text({'_exact':Keyword()}),
        'owner': Text(),
        'uuid': Text({'_exact':Keyword()}),
        'value': Nested(properties={
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english'),
            'experiments': Text(multi=True, fields={'_exact':Keyword()}),
            'files': Text(multi=True, fields={'_exact': Keyword()}),
            'modelConfigs': Text(multi=True, fields={'_exact': Keyword()}),
            'project': Text(fields={'_exact': Keyword()}),
            'sensorLists': Text(multi=True, fields={'_exact': Keyword()}),
        })
    })
    experimentsList = Nested(properties={
        'associationIds' : Text(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': Text(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': Text(fields={'_exact':Keyword()}),
            'path': Text(fields={'_exact': Keyword(),
                                   '_path': Text(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': Text({'_exact':Keyword()}),
        'owner': Text(),
        'uuid': Text({'_exact':Keyword()}),
        'value': Nested(properties={
            'authors': Text(multi=True, fields={'_exact': Keyword()}),
            'description': Text(analyzer='english'),
            'equipmentType': Text(analyzer='english', fields={'_exact': Keyword()}),
            'equipmentTypeOther': Text(analyzer='english', fields={'_exact': Keyword()}),
            'experimentalFacility': Text(analyzer='english', fields={'_exact': Keyword()}),
            'experimentalFacilityOther': Text(analyzer='english', fields={'_exact': Keyword()}),
            'title': Text(analyzer='english'),
            'project': Text(fields={'_exact': Keyword()}),
        })
    })
    institutions = Nested(properties={
        'label': Text(fields={'_exact': Keyword()}),
        'name': Text(fields={'_exact': Keyword()})
    })
    modelConfigs = Nested(properties={
        'associationIds' : Text(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': Text(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': Text(fields={'_exact':Keyword()}),
            'path': Text(fields={'_exact': Keyword(),
                                   '_path': Text(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': Text({'_exact':Keyword()}),
        'owner': Text(),
        'uuid': Text({'_exact':Keyword()}),
        'value': Nested(properties={
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english'),
            'experiments': Text(multi=True, fields={'_exact':Keyword()}),
            'files': Text(multi=True, fields={'_exact': Keyword()}),
            'project': Text(fields={'_exact': Keyword()}),
        })
    })
    project = Object(properties={
        'associationIds' : Text(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': Text(fields={'_exact':Keyword()}),
        'lastUpdated': Date(),
        'name': Text({'_exact':Keyword()}),
        'owner': Text(),
        'uuid': Text({'_exact':Keyword()}),
        'value': Object(properties={
            'assocaitedProjects': Nested(properties={
                'href': Text(fields={'_exact': Keyword()}),
                'title': Text(fields={'_exact': Keyword()}, analyzer='english')
            }),
            'awardNumber': Text(fields={'_exact': Keyword()}),
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
            'coPis': Text(multi=True, fields={'_exact': Keyword()}),
            'teamMembers': Text(multi=True, fields={'_exact': Keyword()}),
            'ef': Text(analyzer='english', fields={'_exact': Keyword()}),
            'pi': Text(fields={'_exact': Keyword()}),
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english'),
            'keywords': Text(analyzer='english'),
            'projectId': Text(fields={'_exact': Keyword()}),
            'projectType': Text(fields={'_exact': Keyword()}),
            'dois': Text(fields={'_exact': Keyword()}, multi=True)
        })
    })
    projectId = Text(fields={'_exact': Keyword()})
    reportsList = Nested(properties={
        'associationIds' : Text(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': Text(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': Text(fields={'_exact':Keyword()}),
            'path': Text(fields={'_exact': Keyword(),
                                   '_path': Text(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': Text({'_exact':Keyword()}),
        'owner': Text(),
        'uuid': Text({'_exact':Keyword()}),
        'value': Nested(properties={
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english'),
            'experiments': Text(multi=True, fields={'_exact':Keyword()}),
            'files': Text(multi=True, fields={'_exact': Keyword()}),
            'project': Text(fields={'_exact': Keyword()}),
        })
    })
    sensorLists = Nested(properties={
        'associationIds' : Text(multi=True, fields={'_exact':Keyword()}),
        'created': Date(),
        'doi': Text(fields={'_exact':Keyword()}),
        'fileObjs': Nested(properties={
            'lenght': Long(),
            'name': Text(fields={'_exact':Keyword()}),
            'path': Text(fields={'_exact': Keyword(),
                                   '_path': Text(analyzer=path_analyzer)}),
        }),
        'lastUpdated': Date(),
        'name': Text({'_exact':Keyword()}),
        'owner': Text(),
        'uuid': Text({'_exact':Keyword()}),
        'value': Nested(properties={
            'description': Text(analyzer='english'),
            'title': Text(analyzer='english'),
            'experiments': Text(multi=True, fields={'_exact':Keyword()}),
            'modelConfigs': Text(multi=True, fields={'_exact':Keyword()}),
            'sensorListType': Text(multi=True, fields={'_exact':Keyword()}),
            'files': Text(multi=True, fields={'_exact': Keyword()}),
            'project': Text(fields={'_exact': Keyword()}),
        })
    })
    status = Text()
    users = Nested(properties={
        'email': Text(fields={'_exact': Keyword()}),
        'first_name': Text(fields={'_exact': Keyword()}),
        'last_name': Text(fields={'_exact': Keyword()}),
        'profile': Nested(properties={
            'institution': Text(fields={'_exact': Keyword()}),
        }),
        'username': Text(fields={'_exact': Keyword()}),
    })

    @classmethod
    def from_id(cls, project_id, revision=None, using='default'):
        # if revision number is specified, get that revision, otherwise use
        # "exists" query to get the version where "revision" does NOT exist
        if project_id is None:
            raise DocumentNotFound()

        if revision:
            revision_filter = Q('match', **{'revision': revision})
        else:
            # Search for documents where revision is not specified.
            revision_filter = ~Q('exists', **{'field': 'revision'})

        id_filter = Q('term', **{'projectId._exact': project_id})
        search = cls.search(using=using).filter(id_filter & revision_filter)
        try:
            res = search.execute()
        except Exception as e:
            raise e
        if res.hits.total.value > 1:
            id_filter = Q('term', **{'_id': res[0].meta.id}) 
            # Delete all files indexed with the same system/path, except the first result
            delete_query = id_filter & ~id_filter
            cls.search(using=using).filter(delete_query).delete()
            return cls.get(res[0].meta.id, using=using)
        elif res.hits.total.value == 1:
            return cls.get(res[0].meta.id, using=using)
        else:
            raise DocumentNotFound("No document found for "
                                   "{}".format(project_id))

    @classmethod
    def max_revision(cls, project_id, using='default'):
        id_filter = Q('term', **{'projectId._exact': project_id})
        res = cls.search(using=using).filter(id_filter)
        res.aggs.metric('max_revision', 'max', field='revision')
        max_agg = res.execute().aggregations.max_revision.value
        if max_agg:
            return int(max_agg)
        # return None
        return 0

    class Index:
        name = settings.ES_INDICES['publications']['alias']

@python_2_unicode_compatible
class IndexedCMSPage(Document):
    body = Text(analyzer='english')
    description = Text(analyzer='english')
    django_id = Text(fields={'_exact': Keyword()})
    language = Text(analyzer='english')
    page_id = Long()
    pub_date = Date()
    site_id = Long()
    slug = Text(analyzer='english', fields={'_exact': Keyword()})
    text = Text(analyzer='english')
    title = Text(analyzer='english', fields={'_exact': Keyword()})
    url = Text(fields={'_exact': Keyword()})

    class Index:
        name = settings.ES_INDICES['web_content']['alias']
    class Meta:
        dynamic = MetaField('strict')

@python_2_unicode_compatible
class IndexedPublicationLegacy(Document):
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
    path = Text(fields={'_exact':Keyword(), '_path':Text(analyzer=path_analyzer)})
    title = Text(analyzer='english', fields={'_exact':Keyword()})
    name = Text(fields={'_exact': Keyword()})
    equipment = Nested(
        properties={
            'component': Text(analyzer='english'),
            'equipment': Text(analyzer='english'),
            'equipmentClass': Text(analyzer='english'),
            'facility': Text(analyzer='english')
        })
    system = Text(fields={'_exact':Keyword()})
    organization = Nested(
        properties={
            'country': Text(analyzer='english'),
            'name': Text(analyzer='english'),
            'state': Text(analyzer='english')
        })
    pis = Nested(
        properties={
            'lastName': Text(analyzer='english'),
            'firstName': Text(analyzer='english')
        })
    project = Text(fields={'_exact':Keyword()})
    sponsor = Nested(
        properties={
            'name': Text(analyzer='english'),
            'url': Text()
        })
    fundorg = Text(analyzer='english', fields={'_exact': Keyword()})
    fundorgprojid = Text(fields={'_exact': Keyword()})
    publications = Nested(
        properties={
            'authors': Text(analyzer='english', multi=True),
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
            'path': Text(fields={'_exact': Keyword(), '_path':Text(analyzer=path_analyzer)}),
            'material': Nested(properties={
                'materials': Text(analyzer='english', multi=True),
                'component': Text(analyzer='english')
                }),
            'equipment': Nested(properties={
                'component': Text(analyzer='english'),
                'equipment': Text(analyzer='english'),
                'equipmentClass': Text(analyzer='english'),
                'facility': Text(analyzer='english')
            }),
            'title': Text(analyzer='english'),
            'sensors': Text(analyzer='english', multi=True),
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

    @classmethod
    def from_id(cls, project_id):
        if project_id is None:
            raise DocumentNotFound()
        id_filter = Q('term', **{'name._exact': project_id})
        search = cls.search().filter(id_filter)
        try:
            res = search.execute()
        except Exception as e:
            raise e
        if res.hits.total.value > 1:
            id_filter = Q('term', **{'_id': res[0].meta.id}) 
            # Delete all files indexed with the same system/path, except the first result
            delete_query = id_filter & ~id_filter
            cls.search().filter(delete_query).delete()
            return cls.get(res[0].meta.id)
        elif res.hits.total.value == 1:
            return cls.get(res[0].meta.id)
        else:
            raise DocumentNotFound("No document found for "
                                   "{}".format(project_id))

    class Index:
        name = settings.ES_INDICES['publications_legacy']['alias']
    class Meta:
        dynamic = MetaField('strict')
