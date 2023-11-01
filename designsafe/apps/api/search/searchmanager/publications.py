"""
.. module: portal.apps.api.search.searchmanager.publications
   :synopsis: Manager handling Publications searches.
"""


import logging
from designsafe.apps.api.search.searchmanager.base import BaseSearchManager
from designsafe.apps.data.models.elasticsearch import IndexedPublication
from elasticsearch_dsl import Q, Search, Index
from django.conf import settings
import urllib
import json
from functools import reduce
from designsafe.libs.elasticsearch.docs.publications import BaseESPublication
from designsafe.libs.elasticsearch.docs.publication_legacy import BaseESPublicationLegacy

logger = logging.getLogger(__name__)


class PublicationsSearchManager(BaseSearchManager):
    """ Search manager handling publications.
    """

    def __init__(self, request=None, **kwargs):
        if request:

            qs = request.GET.get('query_string')
            self.query_dict = json.loads(urllib.parse.unquote(qs))
            self.query_string = request.GET.get('query_string').replace("/", "\\/")
            # Check if at least one filter is selected, otherwise assume the user want
            self.is_filter_selected = reduce(lambda x,y: x or y, self.query_dict['typeFilters'].values())

        else:
            self.query_string = kwargs.get('query_string').replace("/", "\\/")

        super(PublicationsSearchManager, self).__init__(
            IndexedPublication, Search())
    
    def experimental_facility_query(self, facility_name):
        if facility_name == 'Other': 
            facility_name = 'other'
            
        return Q({'nested':
                  {'path': 'experimentsList',
                   'query':
                   {'nested':
                    {'path': 'experimentsList.value',
                     'query':
                     {'term':
                      {'experimentsList.value.experimentalFacility._exact': facility_name }}}}}})
    
    def experiment_type_query(self, experiment_type):
        return Q({'nested':
                  {'path': 'experimentsList',
                   'query':
                   {'nested':
                    {'path': 'experimentsList.value',
                     'query':
                     {'match':
                      {'experimentsList.value.experimentType': experiment_type}}}}}})

    def simulation_facility_query(self, facility_name):
        return Q({'nested':
                  {'path': 'simulations',
                    'query':
                      {'nested':
                        {'path': 'simulations.value',
                        'query':
                          {'term':
                            {'simulations.value.facility._exact': facility_name }}}}}})

    def simulation_type_query(self, simulation_type):
        return Q({'term': {'simulations.value.simulationType.keyword': simulation_type}})

    def fr_facility_query(self, facility_name):
        return Q({'nested':
                  {'path': 'project',
                    'query':
                      {'nested':
                        {'path': 'project.value',
                        'query':
                          {'term':
                            {'project.value.facility._exact': facility_name }}}}}})

    def nh_type_query(self, nh_type):
        return Q({'term': {'project.value.nhTypes.keyword': nh_type}})
    
    def nh_event_query(self, nh_event):
        return Q({'match': {'project.value.nhEvent': nh_event}})

    def other_facility_query(self, facility_name):
        return Q({'nested':
                  {'path': 'project',
                    'query':
                      {'nested':
                        {'path': 'project.value',
                        'query':
                          {'term':
                            {'project.value.facility._exact': facility_name }}}}}})
    
    def other_type_query(self, data_type):
        return Q({'term': {'project.value.dataType.keyword': data_type}})

    def hybrid_sim_facility_query(self, facility_name):
        return Q({'nested':
                  {'path': 'hybrid_simulations',
                    'query':
                      {'nested':
                        {'path': 'hybrid_simulations.value',
                        'query':
                          {'term':
                            {'hybrid_simulations.value.facility._exact': facility_name }}}}}})

    def hybrid_sim_type_query(self, sim_type):
        return Q({'term': {'hybrid_simulations.value.simulationType.keyword': sim_type}})

    def experiment_query(self):
        facility_name = self.query_dict['advancedFilters']['experimental']['experimentalFacility']
        experiment_type = self.query_dict['advancedFilters']['experimental']['experimentType'] 
        # Only apply 
        if not self.query_dict['typeFilters']['experimental'] and not (facility_name or experiment_type):
            return None
        expt_query = Q('term', **{'project.value.projectType._exact': 'experimental'}) 

        
        if facility_name:
            expt_query = expt_query & self.experimental_facility_query(facility_name)
        
        
        if experiment_type:
            expt_query = expt_query & self.experiment_type_query(experiment_type)

        return expt_query

    def simulation_query(self):
        simulation_type = self.query_dict['advancedFilters']['simulation']['simulationType']
        facility_name = self.query_dict['advancedFilters']['simulation']['facility']
        if facility_name:
            expt_query = expt_query & self.facility_query(facility_name)
        if not self.query_dict['typeFilters']['simulation'] and not simulation_type:
            return None
        sim_query = Q('term', **{'project.value.projectType._exact': 'simulation'}) 
        
        if simulation_type:
            sim_query = sim_query & self.simulation_type_query(simulation_type)
        return sim_query

    def field_recon_query(self):
        nh_type = self.query_dict['advancedFilters']['field_recon']['naturalHazardType']
        nh_event = self.query_dict['advancedFilters']['field_recon']['naturalHazardEvent']
        facility_name = self.query_dict['advancedFilters']['field_recon']['facility']
        if facility_name:
            expt_query = expt_query & self.facility_query(facility_name)
        if not self.query_dict['typeFilters']['field_recon'] and not (nh_type or nh_event):
            return None
        fr_query = Q('term', **{'project.value.projectType._exact': 'field_recon'}) 
        
        if nh_type:
            fr_query = fr_query & self.nh_type_query(nh_type)

        if nh_event:
            fr_query = fr_query & self.nh_event_query(nh_event) 

        return fr_query

    def other_query(self):
        data_type = self.query_dict['advancedFilters']['other']['dataType']
        if not self.query_dict['typeFilters']['other'] and not data_type:
            return None
        q = Q('term', **{'project.value.projectType._exact': 'other'}) 
        
        if data_type:
            q = q & self.other_type_query(data_type)
        return q

    def hybrid_sim_query(self):
        sim_type = data_type = self.query_dict['advancedFilters']['hybrid_simulation']['hybridSimulationType']
        facility_name = self.query_dict['advancedFilters']['hybrid_simulation']['facility'] 
        if facility_name:
            expt_query = expt_query & self.facility_query(facility_name)
        if not self.query_dict['typeFilters']['hybrid_simulation'] and not sim_type:
            return None 
        q = Q('term', **{'project.value.projectType._exact': 'hybrid_simulation'}) 

        if sim_type:
            q = q & self.hybrid_sim_type_query(sim_type)

        return q

    def author_query(self):
        author = self.query_dict['queries']['author']
        if not author:
            return None

        aq1 = Q({"nested":
                {"path": "users",
                         "ignore_unmapped": True,
                         "query": {
                             "query_string": {"fields": ["users.first_name", "users.last_name", "users.username"], "query": author}
                         }
                         
                         }})

        other_author_fields = ["project.value.pi",
            "project.value.teamOrder.fname",
            "project.value.teamOrder.lname",
            "project.value.teamOrder.name",
            "authors.fname",
            "authors.lname",]

        aq2 = Q('query_string', query=author, fields=other_author_fields)
        
        return aq1 | aq2

    def title_query(self):
        title = self.query_dict['queries']['title']
        if not title:
            return None
        return Q({"query_string": {"fields": ["project.value.title"], "query": title}})

    def keyword_query(self):
        keywords = self.query_dict['queries']['keyword']
        if not keywords:
            return None
        return Q('query_string', query=keywords, fields=['project.value.keywords'])

    def description_query(self):
        description = self.query_dict['queries']['description']
        if not description:
            return None
        return Q('query_string', query=description, fields=['project.value.description'])


    

        


    def construct_query(self, system=None, file_path=None, **kwargs):

        filter_queries = []
        for filter_fn in [self.experiment_query,
                            self.simulation_query, 
                            self.field_recon_query, 
                            self.other_query, 
                            self.hybrid_sim_query,
                            self.author_query, self.title_query, self.description_query, self.keyword_query]:
            filter_query = filter_fn()
            filter_query and filter_queries.append(filter_query) 


        project_query_fields = [
            "projectId",
            "title",
            "description",
            "doi",
            "project.value.title",
            "project.value.keywords",
            "project.value.description",
            "project.value.dataType",
            "project.value.projectType",
            "project.value.dois",
            "project.value.nhLocation",
            "project.value.pi",
            "project.value.teamOrder.fname",
            "project.value.teamOrder.lname",
            "project.value.teamOrder.name",
            "authors.fname",
            "authors.lname",
            "name"
            ]
        published_index_name = list(Index(settings.ES_INDEX_PREFIX.format('publications')).get_alias().keys())[0]
        legacy_index_name = list(Index(settings.ES_INDEX_PREFIX.format('publications-legacy')).get_alias().keys())[0]


        ds_user_query = Q({"nested":
                        {"path": "users",
                         "ignore_unmapped": True,
                         "query": {"query_string":
                                   {"query": self.query_string,
                                    "fields": ["users.first_name",
                                               "users.last_name",
                                               "user.username"],
                                    "lenient": True}}}
                        })
        nees_pi_query = Q({"nested":
                        {"path": "pis",
                         "ignore_unmapped": True,
                         "query": {"query_string":
                                   {"query": self.query_string,
                                    "fields": ["pis.firstName",
                                               "pis.lastName"],
                                    "lenient": True}}}
                        })
        pub_query = Q('query_string', query=self.query_string, default_operator='and', fields=project_query_fields)
        published_query = Q(
            'bool',
            must=[
                # Q('bool', should=[ds_user_query, nees_pi_query, pub_query]),
                Q('bool', should=[
                    Q({'term': {'_index': published_index_name}}),
                ]),
                Q('bool', should=filter_queries),
            ],
            must_not=[
                Q('term', status='publishing'),
                Q('term', status='unpublished'),
                Q('term', status='saved')
            ]
        )

        return published_query

    def listing(self, system=None, file_path=None, offset=0, limit=100, **kwargs):
        """Perform the search and output in a serializable format."""

        query = self.construct_query(system, file_path, **kwargs)
        listing_search = Search()
        listing_search = listing_search.filter(query).sort('_index', {'created': {'order': 'desc', 'unmapped_type': 'long'}})
        listing_search = listing_search.extra(from_=offset, size=limit).source(includes=['project.value', 'created', 'projectId', 'users', 'system'])
        res = listing_search.execute()
        children = []
        for hit in res:
            hit_to_file = BaseESPublication.hit_to_file(hit)
            children.append(hit_to_file)
        result = {
            'trail': [{'name': '$SEARCH', 'path': '/$SEARCH'}],
            'name': '$SEARCH',
            'path': '/',
            'system': system,
            'type': 'dir',
            'children': children,
            'permissions': 'READ'
        }
        return result
