from designsafe.apps.data.models.elasticsearch import IndexedPublication, IndexedPublicationLegacy
from designsafe.apps.api.publications import search_utils
from designsafe.apps.api.agave import get_service_account_client
from designsafe.libs.elasticsearch.exceptions import DocumentNotFound
from designsafe.libs.elasticsearch.utils import new_es_client
from django.contrib.auth import get_user_model
from elasticsearch_dsl import Q
import os
import requests
import datetime
import json
import urllib
import logging

logger = logging.getLogger(__name__)


def _get_user_by_username(hit, username):
    users = getattr(hit, 'users', [])
    if not users:
        try:
            user_obj = get_user_model().objects.get(username=username)
            return "{}, {}".format(user_obj.last_name, user_obj.first_name)
        except:
            return username
    user = next(_user for _user in users if _user['username'] == username)
    return "{}, {}".format(user['last_name'], user['first_name'])


def listing(offset=0, limit=100, limit_fields=True, *args):
    client = new_es_client()
    pub_query = IndexedPublication.search(using=client)
    pub_query = pub_query.filter(Q('term', status='published'))
    pub_query = pub_query.extra(from_=offset, size=limit)
    if limit_fields:
        pub_query = pub_query.source(includes=['project.value.title',
                                            'project.value.pi',
                                            'project.value.keywords',
                                            'project.value.projectType',
                                            'project.value.dataType',
                                            'created',
                                            'projectId',
                                            'project.uuid',
                                            'users',
                                            'system',
                                            'revision'])
    pub_query = pub_query.sort(
        {'created': {'order': 'desc'}}
    )

    res = pub_query.execute()

    hits = list(map(lambda h: {
        **h.to_dict(),
        'pi': _get_user_by_username(h, h.project.value.pi)
    },
        res.hits))

    return {'listing': hits}


def search(offset=0, limit=100, query_string='', limit_fields=True, *args):
    query_dict = json.loads(urllib.parse.unquote(query_string))

    type_filters = query_dict['typeFilters']
    has_type_filters = True in list(map(bool, type_filters.values()))

    def filter_query(type): return Q('term', **{'project.value.projectType._exact': type})
    selected_filters = list(filter(lambda key: bool(type_filters[key]), type_filters.keys()))

    type_query = Q('bool', should=list(map(filter_query, selected_filters)))
    client = new_es_client()
    search = IndexedPublication.search(using=client)
    if has_type_filters:
        search = search.filter(type_query)

    query_filters = []


    # Query string fields
    search_string = query_dict['queries']['searchString']
    if search_string:
        query_filters.append(search_utils.search_string_query(search_string))

    pub_year = query_dict['queries']['publicationYear']
    if pub_year:
        query_filters.append(search_utils.pub_date_query(pub_year))

    # Experimental advanced filters
    facility = query_dict['advancedFilters']['experimental']['experimentalFacility']
    experiment_type = query_dict['advancedFilters']['experimental']['experimentType']
    if facility['name']:
        query_filters.append(search_utils.experimental_facility_query(facility))
    if experiment_type:
        query_filters.append(search_utils.experiment_type_query(experiment_type))

    # Simulation advanced filters
    simulation_type = query_dict['advancedFilters']['simulation']['simulationType']
    if simulation_type:
        query_filters.append(search_utils.simulation_type_query(simulation_type))
    facility = query_dict['advancedFilters']['simulation']['facility']
    if facility:
        query_filters.append(search_utils.simulation_facility_query(facility))

    # Field recon advanced filters
    nh_type = query_dict['advancedFilters']['field_recon']['naturalHazardType']
    fr_type = query_dict['advancedFilters']['field_recon']['frType']
    fr_date = query_dict['advancedFilters']['field_recon']['frDate']
    facility = query_dict['advancedFilters']['field_recon']['facility']

    if nh_type:
        query_filters.append(search_utils.nh_type_query(nh_type))
    if fr_date:
        query_filters.append(search_utils.fr_date_query(fr_date))
    if fr_type:
        query_filters.append(search_utils.fr_type_query(fr_type))
    if facility:
        query_filters.append(search_utils.fr_facility_query(facility))

    # Other advanced filters
    data_type = query_dict['advancedFilters']['other']['dataType']
    facility = query_dict['advancedFilters']['other']['facility']
    if data_type:
        query_filters.append(search_utils.other_type_query(data_type))
    if facility:
        query_filters.append(search_utils.other_facility_query(facility))

    # Hybrid sim advanced filters
    sim_type = data_type = query_dict['advancedFilters']['hybrid_simulation']['hybridSimulationType'] 
    facility = query_dict['advancedFilters']['hybrid_simulation']['facility']
    if sim_type:
        query_filters.append(search_utils.hybrid_sim_type_query(sim_type))
    if facility:
        query_filters.append(search_utils.hybrid_sim_facility_query(facility))

    search = search.filter('bool', must=query_filters)
    search = search.filter(Q('term', status='published'))
    search = search.extra(from_=offset, size=limit)
    if limit_fields:
        search = search.source(includes=['project.value.title',
                                        'project.value.pi',
                                        'project.value.keywords',
                                        'project.value.projectType',
                                        'project.value.dataType',
                                        'created',
                                        'projectId',
                                        'users',
                                        'system',
                                        'revision'])

    search = search.sort(
        {'created': {'order': 'desc'}})
    res = search.execute()
    hits = list(map(lambda h: {
        **h.to_dict(),
        'pi': _get_user_by_username(h, h.project.value.pi)
    },
        res.hits))

    return {'listing': hits}


def metrics(project_id, *args, **kwargs):
    """retrieve metrics for a given project ID"""

    client = get_service_account_client()
    query = {'name': 'designsafe.metrics.{}'.format(project_id)}
    metrics_meta = client.meta.listMetadata(q=json.dumps(query))[0]
    return metrics_meta


def neeslisting(offset=0, limit=100, limit_fields=True, q='', *args):
    client = new_es_client()
    pub_query = IndexedPublicationLegacy.search(using=client)
    pub_query = pub_query.extra(from_=offset, size=limit)
    if limit_fields:
        pub_query = pub_query.source(includes=['project', 'pis', 'title', 'startDate', 'path', 'description'])
    pub_query = pub_query.sort(
            {'created': {'order': 'desc', 'unmapped_type': 'long'}}
        )
    res = pub_query.execute()
    hits = list(map(lambda h: h.to_dict(), res.hits))
    if q:
        return neessearch(offset=offset, limit=limit, query_string=q)
    return {'listing': hits, 'total': res.hits.total.value}

def neessearch(offset=0, limit=100, query_string='', limit_fields=True, *args):

    nees_pi_query = Q({"nested":
                        {"path": "pis",
                         "ignore_unmapped": True,
                         "query": {"query_string":
                                   {"query": query_string,
                                    "fields": ["pis.firstName",
                                               "pis.lastName"],
                                    "lenient": True}}}})

    nees_query_string_query = Q('query_string', query=query_string, default_operator='and')
    client = new_es_client()
    pub_query = IndexedPublicationLegacy.search(using=client).filter(nees_pi_query | nees_query_string_query)
    pub_query = pub_query.extra(from_=offset, size=limit)
    if limit_fields:
        pub_query = pub_query.source(includes=['project', 'pis', 'title', 'startDate', 'path', 'description'])
    pub_query = pub_query.sort(
            {'created': {'order': 'desc', 'unmapped_type': 'long'}}
        )
    res = pub_query.execute()
    hits = list(map(lambda h: h.to_dict(), res.hits))
    return {'listing': hits, 'total': res.hits.total.value}


def description(project_id, revision=None, *args):
    # TODO: Handle revision for returning description.
    pub_query = IndexedPublication.search()\
        .filter(Q({'term': {'projectId._exact': project_id}}))\
        .source(includes=['project.value.description'])
    desc = next(hit.project.value.description for hit in pub_query.execute().hits)
    return {'description': desc}


def neesdescription(project_id, *args):
    pub_query = IndexedPublicationLegacy.search()\
        .filter(Q({'term': {'project._exact': project_id}}))\
        .source(includes=['description'])
    desc = next(hit.description for hit in pub_query.execute().hits)
    return {'description': desc}


def initilize_publication(publication, status='publishing', revision=None, revision_text=None, revision_titles=None):
        """initilize publication."""
        publication['projectId'] = publication['project']['value']['projectId']
        publication['status'] = status
        publication['version'] = 2
        publication['licenses'] = publication.pop('license', [])
        publication['license'] = ''
        es_client = new_es_client()
        if revision:
            base_pub = IndexedPublication.from_id(publication['projectId'], revision=None, using=es_client)
            publication['created'] = base_pub['created']
            publication['revision'] = revision
            publication['revisionDate'] = datetime.datetime.now().isoformat()
            publication['revisionText'] = revision_text
            if revision_titles:
                publication['revisionTitles'] = revision_titles
        elif 'created' not in publication:
            publication['created'] = datetime.datetime.now().isoformat()
        try:
            pub = IndexedPublication.from_id(publication['projectId'], revision=revision, using=es_client)
            pub.update(using=es_client, **publication)
        except DocumentNotFound:
            pub = IndexedPublication(project_id=publication['projectId'], **publication)
            pub.save(using=es_client)

        pub.save(using=es_client)

        # Refresh index so that search works in subsequent pipeline operations.
        IndexedPublication._index.refresh(using=es_client)
        return pub

def clarivate_single_api(doi):

    base_url = 'https://api.clarivate.com/apis/wos-starter/v1/documents'
    apikey = os.environ.get('WOS_APIKEY')
    
    if not apikey:
        return {"error": "Clarivate API key is missing"}

    if not doi:
        return {"error": "DOI is required"}

    params = {'db': 'DRCI', 'q': f"DO={doi}"}
    
    try:
        response = requests.get(
            base_url,
            headers={'X-Apikey': apikey},
            params=params
        )
        response.raise_for_status()
        rspdict = response.json()

        citations = [
            source['count'] for source in rspdict['hits'][0]['citations']
            if source['db'] == 'WOK'
        ][0]

        return citations

    except requests.exceptions.RequestException as e:
        return {
            "error": str(e),
        }
    except (KeyError, IndexError) as e:
        return {
            "error": "Unexpected response format",
        }
