"""Utility functions for user API"""

import logging
import json
from pytas.http import TASClient
from django.conf import settings
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from designsafe.apps.workspace.models.allocations import UserAllocations

logger = logging.getLogger(__name__)
def _get_tas_allocations(username):

    tas_client = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            "username": settings.TAS_CLIENT_KEY,
            "password": settings.TAS_CLIENT_SECRET,
        },
    )
    tas_projects = tas_client.projects_for_user(username)

    with open("designsafe/apps/api/users/tas_to_tacc_resources.json", encoding="utf-8") as file:
        tas_to_tacc_resources = json.load(file)

    allocation_table = []

    for proj in tas_projects:
        charge_code = proj.get("chargeCode", "N/A")
        for alloc in proj.get("allocations", []):
            resource_name = alloc.get("resource", "UNKNOWN")
            status = alloc.get("status", "UNKNOWN")

            # Proceed anyway regardless of status or missing mapping
            resource_info = tas_to_tacc_resources.get(resource_name, {"host": "unknown"})

            awarded = alloc.get("computeAllocated", 0)
            used = alloc.get("computeUsed", 0.0)
            remaining = round(awarded - used, 3)

            allocation_table.append({
                "system": resource_name,
                "host": resource_info["host"],
                "project_code": charge_code,
                "awarded": awarded,
                "remaining": remaining,
                "expiration": alloc.get("end", "N/A")[:10]
            })
    
    return {"detailed_allocations": allocation_table}

def get_user_data(username):
    """Returns user contact information

    : returns: user_data
    : rtype: dict
    """
    tas_client = TASClient()
    user_data = tas_client.get_user(username=username)
    return user_data

def list_to_model_queries(q_comps):
    query = None
    if len(q_comps) > 2:
        query = Q(first_name__icontains=" ".join(q_comps[:1]))
        query |= Q(first_name__icontains=" ".join(q_comps[:2]))
        query |= Q(last_name__icontains=" ".join(q_comps[1:]))
        query |= Q(last_name__icontains=" ".join(q_comps[2:]))
    else:
        query = Q(first_name__icontains=q_comps[0])
        query |= Q(last_name__icontains=q_comps[1])
    return query

def q_to_model_queries(q):
    if not q:
        return None

    query = None
    if " " in q:
        q_comps = q.split()
        query = list_to_model_queries(q_comps)
    else:
        query = Q(email__icontains=q)
        query |= Q(first_name__icontains=q)
        query |= Q(last_name__icontains=q)
        query |= Q(username__icontains=q)

    return query


def _get_latest_allocations(username):
    """
    Creates or updates allocations cache for a given user and returns new allocations
    """
    user = get_user_model().objects.get(username=username)
    allocations = _get_tas_allocations(username)
    UserAllocations.objects.update_or_create(user=user, defaults={"value": allocations})
    return allocations


def get_allocations(user, force=False):
    """
    Returns indexed allocation data stored in Django DB, or fetches
    allocations from TAS and stores them.
    Parameters
        ----------
        user: User object
            TACC username to fetch allocations for.
        force: bool
        Returns
        -------
        dict
    """
    username = user.username
    try:
        if force:
            logger.info(f"Forcing TAS allocation retrieval for user:{username}")
            raise ObjectDoesNotExist
        result = {"hosts": {}}
        result.update(UserAllocations.objects.get(user=user).value)
        return result
    except ObjectDoesNotExist:
        # Fall back to getting allocations from TAS
        return _get_latest_allocations(username)
