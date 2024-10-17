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


def _get_tas_allocations(username):
    """Returns user allocations on TACC resources

    : returns: allocations
    : rtype: dict
    """

    tas_client = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            "username": settings.TAS_CLIENT_KEY,
            "password": settings.TAS_CLIENT_SECRET,
        },
    )
    tas_projects = tas_client.projects_for_user(username)

    with open(
        "designsafe/apps/api/users/tas_to_tacc_resources.json", encoding="utf-8"
    ) as file:
        tas_to_tacc_resources = json.load(file)

    hosts = {}

    for tas_proj in tas_projects:
        # Each project from tas has an array of length 1 for its allocations
        alloc = tas_proj["allocations"][0]
        charge_code = tas_proj["chargeCode"]
        if alloc["resource"] in tas_to_tacc_resources:
            resource = dict(tas_to_tacc_resources[alloc["resource"]])
            resource["allocation"] = dict(alloc)

            # Separate active and inactive allocations and make single entry for each project
            if resource["allocation"]["status"] == "Active":
                if (
                    resource["host"] in hosts
                    and charge_code not in hosts[resource["host"]]
                ):
                    hosts[resource["host"]].append(charge_code)
                elif resource["host"] not in hosts:
                    hosts[resource["host"]] = [charge_code]
    return {
        "hosts": hosts,
    }


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
