import logging
from pytas.http import TASClient
from django.db.models import Q
from django.conf import settings


logger = logging.getLogger(__name__)


def get_tas_client():
    """Return a TAS Client with pytas"""
    return TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
        }
    )


def get_user_data(username):
    """Returns user contact information

    : returns: user_data
    : rtype: dict
    """
    tas_client = get_tas_client()
    user_data = tas_client.get_user(username=username)
    return user_data


def list_to_model_queries(q_comps):
    query = None
    if len(q_comps) > 2:
        query = Q(first_name__icontains = ' '.join(q_comps[:1]))
        query |= Q(first_name__icontains = ' '.join(q_comps[:2]))
        query |= Q(last_name__icontains = ' '.join(q_comps[1:]))
        query |= Q(last_name__icontains = ' '.join(q_comps[2:]))
    else:
        query = Q(first_name__icontains = q_comps[0])
        query |= Q(last_name__icontains = q_comps[1])
    return query


def q_to_model_queries(q):
    if not q:
        return None

    query = None
    if ' ' in q:
        q_comps = q.split()
        query = list_to_model_queries(q_comps)
    else:
        query = Q(email__icontains = q)
        query |= Q(first_name__icontains = q)
        query |= Q(last_name__icontains = q)

    return query
