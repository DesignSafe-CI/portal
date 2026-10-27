import logging
import os

import httpx2
from asgiref.sync import sync_to_async
from django.conf import settings
from tapipy.tapis import Tapis

from designsafe.apps.api.datafiles.models import PublicationSymlink
from designsafe.apps.api.datafiles.operations.tapis_operations import (
    logentity as sync_logentity,
)
from designsafe.apps.api.datafiles.operations.tapis_operations import (
    preview as sync_preview,
)
from designsafe.apps.api.datafiles.operations.tapis_operations import (
    search,
)
from designsafe.apps.api.datafiles.utils import *
from designsafe.apps.data.tasks import agave_listing_indexer

logger = logging.getLogger(__name__)


def is_file_previewable(file_name):
    """Checking if a file can be previewed based on its extension"""
    if not file_name:
        return False
    file_ext = os.path.splitext(file_name)[1].lower()
    return file_ext in settings.SUPPORTED_PREVIEW_EXTENSIONS


async def listing(
    client: Tapis, system, path, offset=0, limit=100, q=None, *args, **kwargs
):
    """
    Perform a Tapis file listing

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use for the listing.
    system: str
        Tapis system ID.
    path: str
        Path in which to peform the listing.
    offset: int
        Offset for pagination.
    limit: int
        Number of results to return.

    Returns
    -------
    list
        List of dicts containing file metadata
    """

    if q:
        return await sync_to_async(search)(
            client, system, path, offset=0, limit=100, query_string=q, **kwargs
        )
    async with httpx2.AsyncClient() as http_client:
        res = await http_client.get(
            f"{client.base_url}/v3/files/ops/{system}/{path.lstrip('/')}",
            headers={
                "X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", ""),
                "x-tapis-token": client.access_token.access_token,
            },
            params={"offset": offset, "limit": limit},
            timeout=30,
        )
        res.raise_for_status()
        res_json = res.json()

    listing_resp = []
    for f in res_json.get("result", []):
        accessor = f"tapis://{system}/{f['path'].lstrip('/')}"
        type_str = "dir" if f["type"] == "dir" else "file"
        format_str = "folder" if type_str == "dir" else "raw"

        # Update type/format if it's a symlink and we have a DB match
        if f.get("type") == "symbolic_link":
            try:
                rec = await PublicationSymlink.objects.aget(tapis_accessor=accessor)
                type_str = rec.type
                format_str = "folder" if type_str == "dir" else "raw"
            except PublicationSymlink.DoesNotExist:
                type_str = "dir"
                format_str = "folder"
        else:
            type_str = "dir" if f["type"] == "dir" else "file"
            format_str = "folder" if type_str == "dir" else "raw"

        listing_resp.append(
            {
                "system": system,
                "type": type_str,
                "format": format_str,
                "mimeType": f.get("mimeType"),
                "path": f"/{f.get('path')}",
                "name": f.get("name"),
                "length": f.get("size"),
                "lastModified": f.get("lastModified"),
                "_links": {"self": {"href": f.get("url")}},
                "isPreviewable": is_file_previewable(f.get("name")),
            }
        )

    agave_listing_indexer.delay(listing_resp)
    return {"listing": listing_resp, "reachedEnd": len(listing_resp) < int(limit)}


async def detail(client, system, path, *args, **kwargs):
    """
    Retrieve the uuid for a file by parsing the query string in _links.metadata.href
    """

    async with httpx2.AsyncClient() as http_client:
        _listing = await http_client.get(
            f"{client.base_url}/v3/files/ops/{system}/{path.lstrip('/')}",
            headers={
                "X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", ""),
                "x-tapis-token": client.access_token.access_token,
            },
            params={"offset": 0, "limit": 1},
            timeout=30,
        )
        _listing.raise_for_status()
        f = _listing.json()["result"][0]

    listing_res = {
        "system": system,
        "type": "dir" if f["type"] == "dir" else "file",
        "format": "folder" if f["type"] == "dir" else "raw",
        "mimeType": f["mimeType"],
        "path": f"/{f['path']}",
        "name": f["name"],
        "length": f["size"],
        "lastModified": f["lastModified"],
        "_links": {"self": {"href": f["url"]}},
    }

    return listing_res


preview = sync_to_async(sync_preview)

logentity = sync_to_async(sync_logentity)
