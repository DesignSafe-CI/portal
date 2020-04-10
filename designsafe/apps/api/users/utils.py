from django.db.models import Q

import logging

logger = logging.getLogger(__name__)


def list_to_model_queries(q_comps):
    query = None
    if len(q_comps) > 2:
        query = Q(first_name__icontains=' '.join(q_comps[:1]))
        query |= Q(first_name__icontains=' '.join(q_comps[:2]))
        query |= Q(last_name__icontains=' '.join(q_comps[1:]))
        query |= Q(last_name__icontains=' '.join(q_comps[2:]))
    else:
        query = Q(first_name__icontains=q_comps[0])
        query |= Q(last_name__icontains=q_comps[1])
    return query


def q_to_model_queries(q):
    if not q:
        return None

    query = None
    if ' ' in q:
        q_comps = q.split()
        query = list_to_model_queries(q_comps)
    else:
        query = Q(email__icontains=q)
        query |= Q(first_name__icontains=q)
        query |= Q(last_name__icontains=q)

    return query
