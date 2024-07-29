"""Utilities to update the database with existing project file associations"""

import json
import os
from typing import Iterator
import requests
from urllib3.util import Retry
from requests import Session
from requests.exceptions import RetryError
from requests.adapters import HTTPAdapter
from django.conf import settings
from designsafe.apps.api.agave import get_service_account_client_v2 as service_account
from designsafe.apps.api.projects_v2.schema_models._field_models import FileObj
from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata
from designsafe.apps.api.projects_v2.operations.project_meta_operations import (
    add_file_associations,
)


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


def get_entities_by_project_id(project_id: str) -> list[dict]:
    """Return all entities matching a project ID, with the root as element 0."""
    client = service_account()
    base_query = {"value.projectId": project_id, "name": "designsafe.project"}
    root_project_listing = client.meta.listMetadata(q=json.dumps(base_query))
    root_project_meta = root_project_listing[0]

    project_uuid = root_project_meta["uuid"]

    associations_query = {"associationIds": project_uuid}
    associated_entities = client.meta.listMetadata(q=json.dumps(associations_query))

    return list(map(dict, root_project_listing + associated_entities))


def add_files_by_project_id(project_id: str):
    """Get all file associations for a project and update the db to reflect them."""
    entities = get_entities_by_project_id(project_id)
    _session = Session()
    retries = Retry(
        total=3,
        backoff_factor=0.1,
        status_forcelist=[500, 502, 503, 504],
    )
    _session.mount("https://", HTTPAdapter(max_retries=retries))

    with _session as session:
        for entity in entities:
            entity_file_objs = get_files_for_entity(entity, session)
            print(entity_file_objs)
            try:
                add_file_associations(entity["uuid"], entity_file_objs)
            except ProjectMetadata.DoesNotExist:
                continue


def get_files_for_entity(
    entity: dict,
    session: requests.Session,
) -> list[FileObj]:
    """Get file associations for a single entity."""
    headers = {"Authorization": f"Bearer {settings.AGAVE_SUPER_TOKEN}"}
    links: list[dict] = entity["_links"]["associationIds"]
    entity_file_objs = []
    file_links = [
        link["href"].replace("media", "listings", 1)
        for link in links
        if link.get("title", "") == "file"
        and link["href"]
        and not (
            link["href"].endswith("//")
        )  # Don't follow listings that point to the project root
    ]
    for file_link in file_links:
        try:
            resp = session.get(
                file_link,
                headers=headers,
                timeout=10,
            )
            if resp.ok:
                file_meta = resp.json()["result"][0]
                entity_file_objs.append(
                    FileObj(
                        name=os.path.basename(file_meta["path"]),
                        system=file_meta["system"],
                        path=file_meta["path"],
                        type=file_meta["type"],
                        length=file_meta["length"],
                        last_modified=file_meta["lastModified"],
                    )
                )

        except RetryError:
            continue

    return entity_file_objs
