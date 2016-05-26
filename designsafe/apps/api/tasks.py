from celery import shared_task
from django.contrib.auth import get_user_model
import logging
import os

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def reindex_agave(self, username, file_id):
    user = get_user_model().objects.get(username=username)

    from designsafe.apps.api.data import AgaveFileManager
    agave_fm = AgaveFileManager(user)
    system_id, file_user, file_path = agave_fm.parse_file_id(file_id)
    agave_fm.indexer.index(system_id, file_path, file_user, pems_indexing=True)


@shared_task(bind=True)
def box_download(self, username, box_file_id, to_resource, dest_file_id):
    """

    :param self:
    :param username:
    :param box_file_id:
    :param to_resource:
    :param dest_file_id:
    :return:
    """

    logger.debug('Downloading box://{} for user {} to {}://{}'.format(
        box_file_id, username, to_resource, dest_file_id))

    try:
        user = get_user_model().objects.get(username=username)

        from designsafe.apps.api.data import BoxFileManager, AgaveFileManager
        agave_fm = AgaveFileManager(user)
        dest_real_path = agave_fm.get_file_real_path(dest_file_id)

        box_fm = BoxFileManager(user)
        file_type, file_id = box_fm.parse_file_id(box_file_id)

        if file_type == 'file':
            box_download_file(box_fm, file_id, dest_real_path)
        elif file_type == 'folder':
            box_download_folder(box_fm, file_id, dest_real_path)

        # index the new files
        from designsafe.apps.api.data.agave.filemanager import AgaveIndexer
        system_id, file_user, file_path = agave_fm.parse_file_id(dest_file_id)

        agave_fm.indexer.index(system_id, file_path, file_user)
    except:
        logger.exception('Unexpected task failure: box_download', extra={
            'args': {
                'username': username,
                'box_file_id': box_file_id,
                'to_resource': to_resource,
                'dest_file_id': dest_file_id
            }
        })


def box_download_file(box_file_manager, box_file_id, download_directory_path):
    """
    Downloads the file for box_file_id to the given download_path.

    :param box_file_manager:
    :param box_file_id:
    :param download_directory_path:
    :return: the full path to the downloaded file
    """
    box_file = box_file_manager.box_api.file(box_file_id).get()
    file_download_path = os.path.join(download_directory_path, box_file.name)
    logger.debug('Download file {} <= box://file/{}'.format(file_download_path,
                                                            box_file_id))
    with open(file_download_path, 'wb') as download_file:
        box_file.download_to(download_file)
    return file_download_path


def box_download_folder(box_file_manager, box_folder_id, download_path):
    """
    Recursively the folder for box_folder_id, and all of its contents, to the given
    download_path.

    :param box_file_manager:
    :param box_folder_id:
    :param download_path:
    :return:
    """
    box_folder = box_file_manager.box_api.folder(box_folder_id).get()
    directory_path = os.path.join(download_path, box_folder.name)
    logger.debug('Creating directory {} <= box://folder/{}'.format(directory_path,
                                                                   box_folder_id))
    try:
        os.mkdir(directory_path, 0o0755)
    except OSError as e:
        if e.errno == 17:  # directory already exists?
            pass
        else:
            logger.exception('Error creating directory: {}'.format(directory_path))
            raise

    limit = 100
    offset = 0
    while True:
        items = box_folder.get_items(limit, offset)
        for item in items:
            if item.type == 'file':
                box_download_file(box_file_manager, item.object_id, directory_path)
            elif item.type == 'folder':
                box_download_folder(box_file_manager, item.object_id, directory_path)
        if len(items) == limit:
            offset += limit
        else:
            break

@shared_task(bind=True)
def box_upload(self, username, box_file_id, from_resource, upload_file_id):
    logger.debug('Importing file {} for user {} from to {}://{}'.format(
        upload_file_id, username, from_resource, box_file_id))

    try:
        user = get_user_model().objects.get(username=username)

        from designsafe.apps.api.data import BoxFileManager
        box_fm = BoxFileManager(user)
        file_type, file_id = box_fm.parse_file_id(box_file_id)

        if file_type != 'folder':
            logger.warn('Cannot import to a file destination!')
            raise Exception('You can only import files to a folder!', status=400,
                            extra={
                                'box_file_id': box_file_id,
                                'from_resource': from_resource,
                                'upload_file_id': upload_file_id
                            })

        if from_resource == 'agave' or from_resource == 'public':
            try:
                logger.debug('Starting upload to Box...')
                from designsafe.apps.api.data import lookup_file_manager
                agave_fm = lookup_file_manager(from_resource)(user)
                file_real_path = agave_fm.get_file_real_path(upload_file_id)
                if os.path.isfile(file_real_path):
                    box_upload_file(box_fm, file_id, file_real_path)
                elif os.path.isdir(file_real_path):
                    box_upload_directory(box_fm, file_id, file_real_path)
                else:
                    logger.error('Unable to upload {}: file does not exist!'.format(
                        file_real_path))
            except:
                logger.exception('Upload to Box failed!')

        logger.debug('Box upload task complete.')
    except:
        logger.exception('Unexpected task failure: box_upload', extra={
            'args': {
                'username': username,
                'box_file_id': box_file_id,
                'from_resource': from_resource,
                'upload_file_id': upload_file_id
            }
        })


def box_upload_file(box_file_manager, box_folder_id, file_real_path):
    file_path, file_name = os.path.split(file_real_path)
    with open(file_real_path, 'rb') as file_handle:
        box_folder = box_file_manager.box_api.folder(box_folder_id)
        uploaded_file = box_folder.upload_stream(file_handle, file_name)
        logger.info('Successfully uploaded {} to box:folder/{} as box:file/{}'.format(
            file_real_path, box_folder_id, uploaded_file.object_id
        ))


def box_upload_directory(box_file_manager, box_parent_folder_id, dir_real_path):
    """
    Recursively uploads the directory and all of its contents (subdirectories and files)
    to the box folder specified by box_parent_folder_id.

    :param box_file_manager: The box file manager to upload with. Contains user context.
    :param box_parent_folder_id: The box folder to upload the directory to.
    :param dir_real_path: The real path on the filesystem of the directory to upload.
    :return: The new box folder.
    """

    dirparentpath, dirname = os.path.split(dir_real_path)
    box_parent_folder = box_file_manager.box_api.folder(box_parent_folder_id)
    logger.info('Create directory {} in box folder/{}'.format(dirname,
                                                              box_parent_folder_id))
    box_folder = box_parent_folder.create_subfolder(dirname)

    for dirpath, subdirnames, filenames in os.walk(dir_real_path):
        # upload all the files
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            box_upload_file(box_file_manager, box_folder.object_id, filepath)

        # upload all the subdirectories
        for subdirname in subdirnames:
            subdirpath = os.path.join(dirpath, subdirname)
            box_upload_directory(box_file_manager, box_folder.object_id, subdirpath)

        # prevent further walk, because recursion
        subdirnames[:] = []

    return box_folder
