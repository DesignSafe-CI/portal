"""Integration-type tests to confirm that Pydantic schemas are exhaustive."""
import json
from typing import Iterator
from pydantic import BaseModel, ValidationError
from designsafe.apps.projects_v2.schema_models.base import BaseProject
from designsafe.apps.projects_v2.migration_utils.graph_constructor import (
    transform_pub_entities,
)
from designsafe.apps.api.agave import service_account
from designsafe.apps.api.publications.operations import listing as list_pubs


def update_project(uuid, new_value):
    """Utility for patching a dict into entity metadata."""
    client = service_account()
    meta = client.meta.getMetadata(uuid=uuid)
    meta["value"] = {**meta["value"], **new_value}

    meta["lastUpdated"] = meta["lastUpdated"].isoformat()
    meta["created"] = meta["created"].isoformat()
    return client.meta.updateMetadata(uuid=uuid, body=dict(meta))


def iterate_entities(name="designsafe.project") -> Iterator[dict]:
    """Yield all entities for a given namespace"""
    client = service_account()
    query = {"name": name}
    offset = 0
    limit = 100
    while True:
        listing = client.meta.listMetadata(
            q=json.dumps(query), offset=offset, limit=limit
        )
        yield from listing

        if len(listing) < limit:
            break

        offset += limit


def validate_entities(name: str = "designsafe.project", model: BaseModel = BaseProject):
    """Validate a Pydantic model against all instances of an entity namespace."""
    gen = iterate_entities(name)
    for entity in gen:
        try:
            validated_model = model.model_validate(entity["value"])
            model_json = validated_model.model_dump()
            # Assert that subsequent validation does not affect the data.
            assert model.model_validate(model_json).model_dump() == model_json
        except ValidationError as exc:
            print(entity["uuid"])
            print(entity)
            print(exc)


def iterate_pubs():
    """Returns an iterator over all publications."""
    offset = 0
    limit = 100
    while True:
        listing = list_pubs(offset=offset, limit=limit)
        res = listing["listing"]
        yield from res

        if len(res) < limit:
            break

        offset += limit


def validate_publications():
    """Attempt graph construction for all publications."""
    all_pubs = iterate_pubs()
    for pub in all_pubs:
        # print(pub["projectId"])
        try:
            transform_pub_entities(pub["projectId"])
        except ValidationError as exc:
            print(pub["projectId"])
            print(exc)
