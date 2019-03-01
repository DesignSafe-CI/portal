import os
from celery import shared_task
from django.contrib.auth import get_user_model
from django.conf import settings
from designsafe.apps.data.managers.indexer import AgaveIndexer
from designsafe.apps.api.agave import get_service_account_client

def parse_file_id(file_id, username):
    """Parses a `file_id`.

    :param str file_id: String with the format
    <filesystem id>[/ | /<username> [/ | /<file_path>] ]

    :returns: a list with three elements

        * index 0 `system_id`: String. Filesystem id
        * index 1 `file_user`: String. Home directory's username of the
                                file the `file_id` points to.
        * index 2 `file_path`: String. Complete file path.
    :rtype: list

    :raises ValueError: if the object is not in the desired format

    Examples:
    --------
        `file_id` can look like this:
            `designsafe.storage.default`:
            Points to the root folder in the
            `designsafe.storage.default` filesystem.

            `designsafe.stroage.default/username`:
            Points to the home directory of the user `username`.

            `designsafe.storage.default/username/folder`:
            Points to the folder `folder` in the home directory
            of the user `username`.

            `designsafe.stroage.default/username/folder/file.txt`:
            Points to the file `file.txt` in the home directory
            of the username `username`
    """
    if file_id is None or file_id == '':
        system_id = settings.AGAVE_STORAGE_SYSTEM
        file_path = username
        file_user = username
    else:
        components = file_id.strip('/').split('/')
        system_id = components[0] if len(components) >= 1 else settings.AGAVE_STORAGE_SYSTEM
        file_path = '/'.join(components[1:]) if len(components) >= 2 else username
        file_user = components[1] if len(components) >= 2 else username

    return system_id, file_user, file_path

@shared_task(bind=True, max_retries=None)
def reindex_agave(self, username, file_id, full_indexing=True,
                  levels=1, pems_indexing=True, index_full_path=True):

    user = get_user_model().objects.get(username=username)
    #levels=1
    if settings.DEBUG and username == 'ds_admin':
        service_client = get_service_account_client()
        indexer = AgaveIndexer(agave_client=service_client)
    else:
        indexer = AgaveIndexer(agave_client=user.agave_oath.client)

    system_id, file_user, file_path = parse_file_id(file_id, username)
    if system_id != settings.AGAVE_STORAGE_SYSTEM:
        file_id_comps = file_id.strip('/').split('/')
        system_id = file_id_comps[0]
        file_user = username
        if len(file_id_comps) > 1:
            file_path = os.path.join(*file_id_comps[1:])
        else:
            file_path = '/'

    indexer.index(system_id, file_path, file_user,
                           full_indexing = full_indexing,
                           pems_indexing = pems_indexing,
                           index_full_path = index_full_path,
                           levels = levels)
    #parent_path_comps = file_path.strip('/').split('/')
    #if len(parent_path_comps) > 0:
    #    parent_path = os.path.join(*file_path.strip('/').split('/')[:-1])
    #    agave_fm.indexer.index(system_id, parent_path, file_user,
    #    