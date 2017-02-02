"""Main views for sitewide search data. api/search/?*
   All these views return :class:`JsonResponse`s
   These should be general enough to handle various type of public data
   and for authenticated users any private data that they can
   access.
"""
from pprint import pprint
import logging
import json
from elasticsearch_dsl import Q, Search
from django.http import (HttpResponseRedirect,
                         HttpResponseServerError,
                         HttpResponseBadRequest,
                         JsonResponse)
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.agave.filemanager.public_search_index import (
    PublicElasticFileManager, PublicObjectIndexed, connections,
    PublicFullIndexed, CMSIndexed,
    PublicProjectIndexed, PublicExperimentIndexed)

logger = logging.getLogger(__name__)

class SearchView(BaseApiView):
    """Main view to handle sitewise search requests"""
    def get(self, request):
        """GET handler."""
        q = request.GET.get('q')
        system_id = PublicElasticFileManager.DEFAULT_SYSTEM_ID
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))
        if (limit > 500):
            return HttpResponseBadRequest("limit must not exceed 500")
        type_filter = request.GET.get('type_filter', None)
        logger.info(q)

        # search everything that is not a directory. The django_id captures the cms
        # stuff too.
        es_query = Search(index="jmeiring,cms")\
            .query(Q("match", systemId=system_id) | Q("exists", field="django_id"))\
            .query("query_string", query=q, default_operator="and")\
            .query(~Q('match', type='dir'))\
            .highlight("body",
                fragment_size=200,
                pre_tags=["<strong>"],
                post_tags=["</strong>"],
            )\
            .highlight_options(require_field_match=False)\
            .extra(from_=offset, size=limit)
        if type_filter == 'files':
            es_query = es_query.query("match", type="file")\
                .filter("term", _type="object")\
                .query("query_string", query=q, default_operator="and", fields=['name'])
        elif type_filter == 'projects':
            es_query = es_query.filter("term", _type="project")
        elif type_filter == 'experiments':
            es_query = es_query.filter("term", _type="experiment")
        elif type_filter == "publications":
            es_query = es_query.filter("term", _type="project")\
                .query("nested", **{'path':"publications",
                    "inner_hits":{},
                    "query": Q('query_string',
                        fields=["publications.title", "publications.authors"],
                        query=q,
                        default_operator="and")
                    }
                )
        elif type_filter == 'web':
            es_query._index = 'cms'


        logger.info(es_query.to_dict())
        res = es_query.execute()

        # for hit in res.hits:
        #     logger.info(hit.meta.highlight)
            # for frag in hit.meta.highlight.body:
            #     logger.info(frag)

        # these get the counts of the total hits for each category...
        web_query = Search(index="cms")\
            .query("query_string", query=q, default_operator="and")\
            .highlight("body",
                fragment_size=200,
                pre_tags=["<strong>"],
                post_tags=["</strong>"],
            )\
            .highlight_options(require_field_match=False)\
            .extra(from_=offset, size=limit)\
            .execute()

        files_query = Search(index="jmeiring")\
            .query("match", systemId=system_id)\
            .query("query_string", query=q, default_operator="and")\
            .query("match", type="file")\
            .query("query_string", query=q, default_operator="and", fields=['name'])\
            .filter("term", _type="object")\
            .extra(from_=offset, size=limit)\
            .execute()

        pubs_query = Search(index="jmeiring")\
            .query("match", systemId=system_id)\
            .filter("term", _type="project")\
            .query("nested", **{'path':"publications",
                "inner_hits":{},
                "query": Q('query_string',
                    fields=["publications.title", "publications.authors"],
                    query=q,
                    default_operator="and")
                }
            )\
            .extra(from_=offset, size=limit)\
            .execute()

        exp_query = Search(index="jmeiring")\
            .query("match", systemId=system_id)\
            .query("query_string", query=q, default_operator="and")\
            .filter("term", _type="experiment")\
            .extra(from_=offset, size=limit)\
            .execute()

        projects_query = Search(index="jmeiring")\
            .query("match", systemId=system_id)\
            .query("query_string", query=q, default_operator="and")\
            .filter("term", _type="project")\
            .extra(from_=offset, size=limit)\
            .execute()

        results = [r for r in res]
        out = {}
        hits = []
        if (type_filter != 'publications'):
            for r in results:
                logger.info(r.to_dict())
                d = r.to_dict()
                d["doc_type"] = r.meta.doc_type
                logger.info(r.meta)
                if hasattr(r.meta, 'highlight'):
                    d["highlight"] = r.meta.highlight.to_dict()
                hits.append(d)
        pubs = []
        for r in pubs_query:
            logger.info(r.meta.inner_hits)
            for p in r.meta.inner_hits['publications']:
                 d = p.to_dict()
                 d["doc_type"] = "publication"
                 d["project"] = r.to_dict()
                 pubs.append(d)
        if ((type_filter is None) or (type_filter == 'publications')):
            hits.extend(pubs)
        out['total_hits'] = res.hits.total
        out['hits'] = hits
        out['files_total'] = files_query.hits.total
        out['projects_total'] = projects_query.hits.total
        out['experiments_total'] = exp_query.hits.total
        out['cms_total'] = web_query.hits.total
        out['publications_total'] = len(pubs)

        return JsonResponse(out, safe=False)
