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


def clarivate_single_api(doi: str) -> int:
    """
    Return WOS/WOK citation count from Clarivate Starter.
    Be defensive: return 0 on any odd shape or network failure.
    """
    base_url = 'https://api.clarivate.com/apis/wos-starter/v1/documents'
    apikey = os.environ.get('WOS_APIKEY')
    if not apikey or not doi:
        return 0

    try:
        r = requests.get(base_url, headers={'X-Apikey': apikey},
                         params={'db': 'DRCI', 'q': f"DO={doi}"}, timeout=10)
        r.raise_for_status()
        j = r.json()
        hits = j.get('hits') or []
        if not isinstance(hits, list) or not hits:
            return 0
        citations = hits[0].get('citations') or []
        if not isinstance(citations, list):
            return 0
        total = 0
        for src in citations:
            db = (src or {}).get('db')
            cnt_raw = (src or {}).get('count')
            if db in ('WOK', 'PPRN'):
                # Treat missing/blank counts as 0 so we still sum across sources.
                try:
                    cnt = int(cnt_raw)
                except (TypeError, ValueError):
                    cnt = 0
                total += cnt
        return total
    except Exception:
        return 0
    

BASE_WOS_HOSTS = [
    "https://wos-api.clarivate.com/api/wos",  # preferred
    "https://api.clarivate.com/api/wos",      # fallback
]


def _expanded_key():
    k = os.environ.get("WOS_EXP_APIKEY") or os.environ.get("WOS_APIKEY")
    if not k:
        raise RuntimeError("Clarivate Expanded API key is missing")
    return k


def _starter_uid_for_doi(doi: str) -> str | None:
    """Starter sometimes returns a UID; only accept WOS/WOK for /citing."""
    k = os.environ.get("WOS_APIKEY")
    if not k:
        return None
    try:
        r = requests.get(
            "https://api.clarivate.com/apis/wos-starter/v1/documents",
            headers={"X-Apikey": k},
            params={"db": "DRCI", "q": f"DO={doi}"},
            timeout=10,
        )
        r.raise_for_status()
        j = r.json()
        hit = (j.get("hits") or [None])[0] or {}
        uid = hit.get("uid") or hit.get("uid_wos")
        return uid if isinstance(uid, str) and (uid.startswith("WOS:") or uid.startswith("WOK:")) else None
    except Exception:
        return None


def _wos_get(path="", *, params=None, timeout=12):
    k = _expanded_key()
    last_exc = None
    for base in BASE_WOS_HOSTS:
        try:
            return requests.get(f"{base}{path}", headers={"X-Apikey": k}, params=params, timeout=timeout)
        except Exception as e:
            last_exc = e
    raise last_exc


def _lookup_uid_for_doi(doi: str, debug: dict | None = None) -> str | None:
    uid = _starter_uid_for_doi(doi)
    if uid:
        debug and debug.setdefault("uid_attempts", []).append({"source": "STARTER", "uid": uid})
        return uid

    for db in ("WOS", "WOK", "DCI"):
        r = _wos_get("", params={"databaseId": db, "usrQuery": f"DO=({doi})", "optionView": "SR"}, timeout=8)
        if debug is not None:
            debug.setdefault("uid_attempts", []).append({"db": db, "status": r.status_code, "body_snippet": r.text[:200]})
        if r.status_code != 200:
            continue
        try:
            j = r.json()
        except Exception:
            continue
        recs = (((j.get("Data") or {}).get("Records") or {}).get("records"))
        if isinstance(recs, str) or not recs:
            continue
        if isinstance(recs, dict):
            rec = recs.get("REC")
        else:
            rec = recs
        if isinstance(rec, list):
            rec = rec[0] if rec else None
        if isinstance(rec, dict):
            uid = rec.get("UID")
            if uid:
                return uid
    return None  


def clarivate_wos_exp_single_api_basic(doi: str, debug: dict | None = None) -> dict:
    """Return a dict with QueryResult/Data; never raise on empty/odd shapes."""
    uid = _lookup_uid_for_doi(doi, debug)
    if not uid:
        raise RuntimeError("Could not resolve UID for DOI")

    last = None
    for db in ("WOK",):
        r = _wos_get("/citing", params={"databaseId": db, "uniqueId": uid, "count": 100}, timeout=12)
        if debug is not None:
            debug.setdefault("citing_attempts", []).append({"db": db, "status": r.status_code, "body_snippet": r.text[:200]})
        if r.status_code != 200:
            last = requests.HTTPError(f"{r.status_code} for /citing {db}")
            continue
        try:
            j = r.json()
        except Exception as e:
            last = e
            continue
        # Ensure we always return a predictable dict
        q = j.get("QueryResult") or {}
        if not isinstance(q, dict):
            q = {}
        if "QueryResult" not in j:
            j["QueryResult"] = q
        d = j.get("Data") or {}
        if not isinstance(d, dict):
            d = {}
        if "Data" not in j:
            j["Data"] = d
        recs = (d.get("Records") or {}).get("records")
        # If Clarivate sends records as "", keep it—caller checks RecordsFound
        return j

    # If both attempts failed, raise the last error
    if last:
        raise last
    raise RuntimeError("Failed to fetch citing records")


def build_citation_json(citeresponse: dict) -> list[dict]:
    import logging
    log = logging.getLogger(__name__)
    cites: list[dict] = []

    try:
        if not isinstance(citeresponse, dict):
            return []

        q = citeresponse.get('QueryResult') or {}
        found = q.get('RecordsFound', 0) or 0
        if not isinstance(found, int):
            try:
                found = int(found)
            except Exception:
                found = 0
        if found == 0:
            return []

        # records can be "", {}, {"REC": {...}} or {"REC": [...]}
        recs_container = (((citeresponse.get('Data') or {}).get('Records') or {}).get('records'))
        if not recs_container or isinstance(recs_container, str):
            return []

        if isinstance(recs_container, dict):
            recs = recs_container.get('REC')
        else:
            recs = recs_container  # fail-soft

        if not recs:
            return []
        if isinstance(recs, dict):
            recs = [recs]
        if not isinstance(recs, list):
            return []

        for rec in recs:
            if not isinstance(rec, dict):
                continue

            uid = rec.get('UID')
            if isinstance(uid, str):
                src_db = uid.split(':', 1)[0]
                if src_db == 'GCI':
                    continue

            # identifiers → citing DOI
            ids = ((((rec.get('dynamic_data') or {})
                     .get('cluster_related') or {})
                     .get('identifiers') or {})
                   .get('identifier')) or []
            if isinstance(ids, dict):
                ids = [ids]
            doi_vals = [i.get('value') for i in ids if isinstance(i, dict) and i.get('type') == 'doi']
            doi = doi_vals[0] if doi_vals else ''

            # summary / titles
            summary = (rec.get('static_data') or {}).get('summary') or {}
            tdata = ((summary.get('titles') or {}).get('title')) or []
            if isinstance(tdata, dict):
                tdata = [tdata]
            tmap = {t.get('type'): t.get('content') for t in tdata if isinstance(t, dict)}
            titles = {
                'item': tmap.get('item', ''),
                'source': (tmap.get('source') or '').title(),
                'book_subtitle': tmap.get('book_subtitle', ''),
                'series': tmap.get('series', ''),
            }

            # names
            names_elem = ((summary.get('names') or {}).get('name')) or []
            if isinstance(names_elem, dict):
                names_elem = [names_elem]
            names = []
            for n in names_elem:
                if not isinstance(n, dict):
                    continue
                names.append({
                    'first_name': n.get('first_name', ''),
                    'last_name': n.get('last_name', '') or n.get('display_name', ''),
                    'role': n.get('role', ''),
                })

            # pub info
            pub_info = summary.get('pub_info') or {}
            page = pub_info.get('page') or {}
            pubinfo = {
                'pubtype':  pub_info.get('pubtype',  ''),
                'pubyear':  pub_info.get('pubyear',  ''),
                'pubmonth': pub_info.get('pubmonth', ''),
                'vol':      pub_info.get('vol',      ''),
                'issue':    pub_info.get('issue',    ''),
                'page':     {'begin': page.get('begin', ''), 'end': page.get('end', '')},
            }

            cites.append({'doi': doi, 'titles': titles, 'names': names, 'pubinfo': pubinfo})

    except Exception as e:
        # never crash the endpoint
        log.warning('build_citation_json failed safely: %s', e)

    return cites
