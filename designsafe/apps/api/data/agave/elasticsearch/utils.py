from elasticsearch_dsl.query import Q
import os
import re
import logging

logger = logging.getLogger(__name__)

def sanitize_query_string(q):
    q = re.sub(r'(["+\-=><!\(\)\{\}\[\]\^~\*\?\:\\\/])', r'\\\1', q)
    q = q.replace('&&', '\&&')
    return q

def files_wildcard_query(q, fields, min_should_match = 1):
    wildcards = []
    for f in fields:
        d = {}
        d[f] = {'value': '*%s*' % q}
        wildcards.append(Q({'wildcard': d}))

    qo = Q('bool',
              should = wildcards,
              minimum_should_match = min_should_match
             )
    return qo

def files_access_filter(username, system = None, deleted = False):
    must_queries = [
            Q({'term': {'permissions.username': username}}),
            Q({'term': {'deleted': deleted}})
          ]
    if system is not None:
        must_queries.append(Q({'term': {'systemId': system}}))

    q = Q('bool',
          must = must_queries
          )
    return q
