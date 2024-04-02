import dropbox
import os
import logging
from dropbox.exceptions import ApiError
import os
import datetime
from django.conf import settings
import io

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
                "system": None,
                "type": "dir" if type(f) == dropbox.files.FolderMetadata else "file",
                "format": (
                    "folder" if type(f) == dropbox.files.FolderMetadata else "raw"
                ),
                "mimeType": None,
                "path": f.path_display,
                "name": f.name,
                "length": 0 if type(f) == dropbox.files.FolderMetadata else f.size,
                "lastModified": (
                    None
                    if type(f) == dropbox.files.FolderMetadata
                    else f.server_modified
                ),
            },
            files.entries,
        )
    )

    reachedEnd = not files.has_more
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


def preview(client, system, path, *args, **kwargs):
    if path and not path.startswith("/"):
        path = "/" + path

    file_name = path.strip("/").split("/")[-1]
    file_ext = os.path.splitext(file_name)[1].lower()

    url = client.files_get_temporary_link(path).link

    if file_ext in settings.SUPPORTED_TEXT_PREVIEW_EXTS:
        file_type = "text"
    elif file_ext in settings.SUPPORTED_IMAGE_PREVIEW_EXTS:
        file_type = "image"
    elif file_ext in settings.SUPPORTED_OBJECT_PREVIEW_EXTS:
        file_type = "object"
        url = "https://docs.google.com/gview?url={}&embedded=true".format(url)
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
    client,
    src_system,
    src_path,
    dest_system,
    dest_path,
    filename,
    filetype="file",
    *args
):
    if src_path and not src_path.startswith("/"):
        src_path = "/" + src_path
    if dest_path and not dest_path.startswith("/"):
        dest_path = "/" + dest_path
    dest_path = "{}/{}".format(dest_path, filename)

    client.files_copy(src_path, dest_path, autorename=True)

    return {}


def download_bytes(client, system, path):
    if not path.startswith("/"):
        path = "/" + path
    (meta, response) = client.files_download(path)
    result = io.BytesIO(response.content)
    result.name = meta.name
    response.close()
    return result


def upload(client, system, path, uploaded_file):
    if path and not path.startswith("/"):
        path = "/" + path
    upload_path = "{}/{}".format(path, uploaded_file.name).replace("//", "/")
    client.files_upload(uploaded_file.getvalue(), upload_path, autorename=True)
    return {}


def mkdir(client, system, path, dirname):
    if path and not path.startswith("/"):
        path = "/" + path
    folder_path = "{}/{}".format(path, dirname).replace("//", "/")
    client.files_create_folder(folder_path)
    return {"name": dirname, "path": folder_path}
