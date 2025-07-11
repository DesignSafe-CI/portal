import os
import io
import logging
from dropbox import Dropbox
from dropbox.files import FolderMetadata
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import TemporaryUploadedFile

logger = logging.getLogger(__name__)


def listing(
    client, system, path, offset=None, limit=100, nextPageToken=None, *args, **kwargs
):
    limit = int(limit)
    if path and not path.startswith("/"):
        path = "/" + path

    if not nextPageToken:
        files = client.files_list_folder(path, limit=limit)
    else:
        files = client.files_list_folder_continue(nextPageToken)

    listing = list(
        map(
            lambda f: {
                "system": "dropbox",
                "type": ("dir" if isinstance(f, FolderMetadata) else "file"),
                "format": ("folder" if isinstance(f, FolderMetadata) else "raw"),
                "mimeType": None,
                "path": f.path_display,
                "name": f.name,
                "length": 0 if isinstance(f, FolderMetadata) else f.size,
                "lastModified": (
                    None if isinstance(f, FolderMetadata) else f.server_modified
                ),
            },
            files.entries,
        )
    )

    nextPageToken = files.cursor if files.has_more else None

    return {
        "listing": listing,
        "nextPageToken": nextPageToken,
        "reachedEnd": not files.has_more,
    }


def iterate_listing(client, system, path, limit=100):
    scroll_token = None
    while True:
        _listing = listing(
            client, system, path, limit=limit, nextPageToken=scroll_token
        )

        scroll_token = _listing["nextPageToken"]
        yield from _listing["listing"]

        if not scroll_token:
            break


def preview(client: Dropbox, system, path, *args, **kwargs):
    if path and not path.startswith("/"):
        path = "/" + path

    file_name = path.strip("/").split("/")[-1]
    file_ext = os.path.splitext(file_name)[1].lower()

    url = client.files_get_temporary_link(path).link

    if file_ext in settings.SUPPORTED_TEXT_PREVIEW_EXTS:
        if file_ext == ".hazmapper":
            file_type = "hazmapper"
        else:
            file_type = "text"
    elif file_ext in settings.SUPPORTED_IMAGE_PREVIEW_EXTS:
        file_type = "image"
    elif file_ext in settings.SUPPORTED_OBJECT_PREVIEW_EXTS:
        file_type = "object"
    elif file_ext in settings.SUPPORTED_MS_OFFICE:
        file_type = "ms-office"
        url = "https://view.officeapps.live.com/op/view.aspx?src={}".format(url)
    elif file_ext in settings.SUPPORTED_VIDEO_EXTS:
        file_type = "video"
        # url = '/api/datafiles/media/agave/private/{}/{}'.format(system, path)
    elif file_ext in settings.SUPPORTED_IPYNB_PREVIEW_EXTS:
        file_type = "ipynb"
        tmp = url.replace("https://", "")
        url = "https://nbviewer.jupyter.org/urls/{tmp}".format(tmp=tmp)
    else:
        file_type = "other"
    return {"href": url, "fileType": file_type}


def copy(
    src_client: Dropbox,
    src_system,
    src_path,
    dest_system,
    dest_path,
    dest_api,
    username,
    *args,
    **kwargs,
):
    src_file_name = os.path.basename(src_path)
    if src_system != dest_system:

        from designsafe.apps.api.datafiles.operations.transfer_operations import (
            transfer,
        )
        from designsafe.apps.api.datafiles.handlers import resource_unconnected_handler
        from designsafe.apps.api.datafiles.views import get_client

        user = get_user_model().objects.get(username=username)
        dest_client = None
        try:
            dest_client = get_client(user, dest_api, dest_system)
        except AttributeError:
            raise resource_unconnected_handler(dest_api)

        if not src_path:
            src_path = "root"

        transfer(
            src_client,
            dest_client,
            "dropbox",
            dest_api,
            src_system,
            dest_system,
            src_path,
            dest_path,
        )
    else:
        if src_path and not src_path.startswith("/"):
            src_path = "/" + src_path
        if dest_path and not dest_path.startswith("/"):
            dest_path = "/" + dest_path
        dest_path = "{}/{}".format(dest_path, src_file_name)

        src_client.files_copy(src_path, dest_path, autorename=True)

    return {"result": "OK"}


def download(client: Dropbox, system, path, *args, **kwargs):
    logger.debug("Downloading file from Dropbox: {}".format(path))
    if not path.startswith("/"):
        path = "/" + path
    (meta, response) = client.files_download(path)
    result = io.BytesIO(response.content)
    result.name = meta.name
    response.close()
    return result


def upload(
    client: Dropbox,
    system,
    path,
    uploaded_file: TemporaryUploadedFile,
    *args,
    **kwargs,
):
    if path and not path.startswith("/"):
        path = "/" + path
    upload_path = "{}/{}".format(path, uploaded_file.name).replace("//", "/")
    client.files_upload(uploaded_file.read(), upload_path, autorename=True)
    return {"result": "OK"}


def mkdir(client, system, path, dir_name, *args, **kwargs):
    if path and not path.startswith("/"):
        path = "/" + path
    folder_path = "{}/{}".format(path, dir_name).replace("//", "/")
    client.files_create_folder(folder_path)
    return {"name": dir_name, "path": folder_path}


def detail(client, system, path, *args, **kwargs):
    """
    Retrieve the uuid for a file by parsing the query string in _links.metadata.href
    """
    f = client.files_get_metadata(path)

    listing_res = {
        "system": "dropbox",
        "type": "dir" if isinstance(f, FolderMetadata) else "file",
        "format": ("folder" if isinstance(f, FolderMetadata) else "raw"),
        "mimeType": None,
        "path": f.path_display,
        "name": f.name,
        "length": 0 if isinstance(f, FolderMetadata) else f.size,
        "lastModified": (None if isinstance(f, FolderMetadata) else f.server_modified),
    }

    return listing_res
