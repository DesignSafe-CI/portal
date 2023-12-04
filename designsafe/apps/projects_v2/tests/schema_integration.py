"""Integration-type tests to confirm that Pydantic schemas are exhaustive."""
import json
from typing import Iterator
from pydantic import BaseModel, ValidationError
from designsafe.apps.projects_v2.schema_models.base import BaseProject
from designsafe.apps.api.agave import service_account


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
            model.model_validate(entity["value"])
        except ValidationError as exc:
            print(entity["uuid"])
            print(entity)
            print(exc)
