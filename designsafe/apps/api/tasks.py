import shutil
import logging
import re
import os
import sys
import json
import urllib
from datetime import datetime
from celery import shared_task
from django.core.urlresolvers import reverse
from django.contrib.auth import get_user_model
from django.conf import settings
from requests.exceptions import HTTPError

from designsafe.apps.api.notifications.models import Notification, Broadcast
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.projects.models.elasticsearch import IndexedProject
from designsafe.apps.data.tasks import agave_indexer
from elasticsearch_dsl.query import Q

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=None)
def reindex_agave(self, username, file_id, full_indexing=True,
                  levels=1, pems_indexing=True, index_full_path=True):
    user = get_user_model().objects.get(username=username)
    #levels=1
    
    from designsafe.apps.api.data import AgaveFileManager
    from designsafe.apps.data.managers.indexer import AgaveIndexer as AgaveFileIndexer
    agave_fm = AgaveFileManager(user)
    
    if settings.DEBUG and username == 'ds_admin':
        service_client = get_service_account_client()
        agave_fm.agave_client = service_client
        agave_fm.indexer = AgaveFileIndexer(agave_client=service_client)

    system_id, file_user, file_path = agave_fm.parse_file_id(file_id)
    if system_id != settings.AGAVE_STORAGE_SYSTEM:
        file_id_comps = file_id.strip('/').split('/')
        system_id = file_id_comps[0]
        file_user = username
        if len(file_id_comps) > 1:
            file_path = os.path.join(*file_id_comps[1:])
        else:
            file_path = '/'

    agave_fm.indexer.index(system_id, file_path, file_user,
                           full_indexing = full_indexing,
                           pems_indexing = pems_indexing,
                           index_full_path = index_full_path,
                           levels = levels)
    #parent_path_comps = file_path.strip('/').split('/')
    #if len(parent_path_comps) > 0:
    #    parent_path = os.path.join(*file_path.strip('/').split('/')[:-1])
    #    agave_fm.indexer.index(system_id, parent_path, file_user,
    #                           levels = 1)


@shared_task(bind=True)
def share_agave(self, username, file_id, permissions, recursive):
    try:
        # n = Notification(event_type = 'data',
        #                  status = 'INFO',
        #                  operation = 'share_initializing',
        #                  message = 'File sharing is initializing. Please wait...',
        #                  user = username,
        #                  extra = {'target_path': reverse('designsafe_data:data_depot',
        #                                                  args=['agave', file_id])})
        # n.save()
        user = get_user_model().objects.get(username=username)

        from designsafe.apps.api.data import AgaveFileManager
        from designsafe.apps.api.data.agave.file import AgaveFile
        from designsafe.apps.api.data.agave.elasticsearch.documents import Object
        agave_fm = AgaveFileManager(user)
        system_id, file_user, file_path = agave_fm.parse_file_id(file_id)

        f = AgaveFile.from_file_path(system_id, username, file_path,
                                     agave_client=agave_fm.agave_client)
        f_dict = f.to_dict()

        n = Notification(event_type = 'data',
                         status = 'INFO',
                         operation = 'share_initializing',
                         message = 'File sharing is initializing. Please wait...',
                         user = username,
                         extra = f_dict)
        n.save()

        f.share(permissions, recursive)
        #reindex_agave.apply_async(args=(self.username, file_id))
        # self.indexer.index(system, file_path, file_user, pems_indexing=True)

        esf = Object.from_file_path(system_id, username, file_path)
        esf.share(username, permissions, recursive)

        # Notify owner share completed
        n = Notification(event_type = 'data',
                         status = 'SUCCESS',
                         operation = 'share_finished',
                         message = 'File permissions were updated successfully.',
                         user = username,
                         extra = f_dict)
        n.save()

        # Notify users they have new shared files
        for pem in permissions:
            if pem['permission'] != 'NONE':
                message = '%s shared some files with you.' % user.get_full_name()
                n = Notification(event_type = 'data',
                                 status = 'SUCCESS',
                                 operation = 'share_finished',
                                 message = message,
                                 user = pem['user_to_share'],
                                 extra = f_dict)
                n.save()

    except:
        logger.error('Error sharing file/folder', exc_info=True,
                     extra = {
                         'username': username,
                         'file_id': file_id,
                         'permissions': permissions
                     })
        n = Notification(event_type='data',
                         status=Notification.ERROR,
                         operation='share_error',
                         message='We were unable to share the specified folder/file(s). '
                                 'Please try again...',
                         user=username,
                         extra={'system': system_id,
                                'path': file_path
                         })
        n.save()

@shared_task(bind=True)
def box_download(self, username, src_resource, src_file_id, dest_resource, dest_file_id):
    """
    :param self:
    :param username:
    :param src_resource:
    :param src_file_id:
    :param dest_resource:
    :param dest_file_id:
    :return:
    """

    logger.debug('Downloading %s://%s for user %s to %s://%s',
                 src_resource, src_file_id, username, dest_resource, dest_file_id)

    try:
        target_path = reverse('designsafe_data:data_depot',
                              args=[src_resource, src_file_id])
        n = Notification(event_type='data',
                         status=Notification.INFO,
                         operation='box_download_start',
                         message='Starting download of file %s from box.' % (src_file_id,),
                         user=username,
                         # extra={'target_path': target_path})
                         extra={'id': dest_file_id}
                         )
        n.save()

        user = get_user_model().objects.get(username=username)

        from designsafe.apps.api.data import BoxFileManager, AgaveFileManager
        agave_fm = AgaveFileManager(user)
        dest_real_path = agave_fm.get_file_real_path(dest_file_id)

        box_fm = BoxFileManager(user)
        file_type, file_id = box_fm.parse_file_id(src_file_id)

        levels = 0
        downloaded_file_path = None
        if file_type == 'file':
            downloaded_file_path = box_download_file(box_fm, file_id, dest_real_path)
            levels = 1
        elif file_type == 'folder':
            downloaded_file_path = box_download_folder(box_fm, file_id, dest_real_path)

        if downloaded_file_path is not None:
            downloaded_file_id = agave_fm.from_file_real_path(downloaded_file_path)
            system_id, file_user, file_path = agave_fm.parse_file_id(downloaded_file_id)
            agave_fm.indexer.index(system_id, file_path, file_user, full_indexing=True,
                                   pems_indexing=True, index_full_path=True,
                                   levels=levels)

        target_path = reverse('designsafe_data:data_depot',
                              args=[dest_resource, dest_file_id])
        n = Notification(event_type='data',
                         status=Notification.SUCCESS,
                         operation='box_download_end',
                         message='File %s was copied from box successfully!' % (src_file_id, ),
                         user=username,
                         extra={'id': dest_file_id}
                         )
        n.save()
    except:
        logger.exception('Unexpected task failure: box_download', extra={
            'username': username,
            'box_file_id': src_file_id,
            'to_resource': dest_resource,
            'dest_file_id': dest_file_id
        })
        target_path = reverse('designsafe_data:data_depot',
                              args=[src_resource, src_file_id])
        n = Notification(event_type='data',
                         status=Notification.ERROR,
                         operation='box_download_error',
                         message='We were unable to get the specified file from box. '
                                 'Please try again...',
                         user=username,
                         extra={'system': dest_resource,
                                'id': dest_file_id,
                                'src_file_id': src_file_id,
                                'src_resource': src_resource
                         })
        n.save()


def box_download_file(box_file_manager, box_file_id, download_directory_path):
    """
    Downloads the file for box_file_id to the given download_path.

    :param box_file_manager:
    :param box_file_id:
    :param download_directory_path:
    :return: the full path to the downloaded file
    """
    box_file = box_file_manager.box_api.file(box_file_id).get()
    safe_filename = box_file.name.encode(sys.getfilesystemencoding(), 'ignore')  # convert utf-8 chars
    file_download_path = os.path.join(download_directory_path, safe_filename)
    logger.debug('Download file %s <= box://file/%s', file_download_path, box_file_id)

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
    safe_dirname = box_folder.name.encode(sys.getfilesystemencoding(), 'ignore')  # convert utf-8 chars
    directory_path = os.path.join(download_path, safe_dirname)
    logger.debug('Creating directory %s <= box://folder/%s', directory_path, box_folder_id)
    try:
        os.mkdir(directory_path, 0o0755)
    except OSError as e:
        if e.errno == 17:  # directory already exists?
            pass
        else:
            logger.exception('Error creating directory: %s', directory_path)
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

    return directory_path


@shared_task(bind=True)
def box_upload(self, username, src_resource, src_file_id, dest_resource, dest_file_id):
    """
    :param self:
    :param username:
    :param src_resource: should be 'agave'
    :param src_file_id: the agave file id
    :param dest_resource: should be 'box'
    :param dest_file_id: the box id of the destination folder
    :return:
    """
    logger.debug('Importing file %s://%s for user %s to %s://%s' % (
        src_resource, src_file_id, username, dest_resource, dest_file_id))

    try:
        n = Notification(event_type = 'data',
                         status = Notification.INFO,
                         operation = 'box_upload_start',
                         message = 'Starting import of file %s into box.' % src_file_id,
                         user = username,
                         # extra = {'target_path': '%s%s/%s' %(reverse('designsafe_data:data_depot'), src_resource, src_file_id)})
                         extra={'id': src_file_id})
        n.save()
        user = get_user_model().objects.get(username=username)

        from designsafe.apps.api.data import BoxFileManager
        box_fm = BoxFileManager(user)
        file_type, file_id = box_fm.parse_file_id(dest_file_id)

        if file_type != 'folder':
            logger.warn('Cannot import to a file destination!')
            raise Exception('You can only import files to a folder!', status=400,
                            extra={
                                'src_resource': src_resource,
                                'src_file_id': src_file_id,
                                'dest_resource': dest_resource,
                                'dest_file_id': dest_file_id,
                            })

        if src_resource == 'agave' or src_resource == 'public':
            try:
                logger.debug('Starting upload to Box...')
                from designsafe.apps.api.data import lookup_file_manager
                agave_fm = lookup_file_manager(src_resource)(user)
                file_real_path = agave_fm.get_file_real_path(src_file_id)
                if os.path.isfile(file_real_path):
                    box_upload_file(box_fm, file_id, file_real_path)
                elif os.path.isdir(file_real_path):
                    box_upload_directory(box_fm, file_id, file_real_path)
                else:
                    logger.error('Unable to upload %s: file does not exist!',
                                 file_real_path)
            except:
                logger.exception('Upload to Box failed!')

        logger.debug('Box upload task complete.')

        n = Notification(event_type = 'data',
                         status = Notification.SUCCESS,
                         operation = 'box_upload_end',
                         message = 'File(s) %s succesfully uploaded into box!' % src_file_id,
                         user = username,
                         extra={'id': src_file_id})
                         # extra = {'target_path': '%s%s/%s' %(reverse('designsafe_data:data_depot'), dest_resource, dest_file_id)})
        n.save()
    except:
        logger.exception('Unexpected task failure: box_upload', extra={
            'username': username,
            'src_resource': src_resource,
            'src_file_id': src_file_id,
            'dest_resource': dest_resource,
            'dest_file_id': dest_file_id,
        })
        n = Notification(event_type = 'data',
                         status = Notification.ERROR,
                         operation = 'box_download_error',
                         message = 'We were unable to get the specified file from box. Please try again...',
                         user = username,
                         extra={
                                'src_resource': src_resource,
                                'id': src_file_id,
                                'dest_resource': dest_resource,
                                'dest_file_id': dest_file_id,
                            })
                         # extra = {'target_path': '%s%s/%s' %(reverse('designsafe_data:data_depot'), src_resource, src_file_id)})
        n.save()


def box_upload_file(box_file_manager, box_folder_id, file_real_path):
    file_path, file_name = os.path.split(file_real_path)
    with open(file_real_path, 'rb') as file_handle:
        box_folder = box_file_manager.box_api.folder(box_folder_id)
        uploaded_file = box_folder.upload_stream(file_handle, file_name)
        logger.info('Successfully uploaded %s to box:folder/%s as box:file/%s',
                    file_real_path, box_folder_id, uploaded_file.object_id)


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
    logger.info('Create directory %s in box folder/%s', dirname, box_parent_folder_id)
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


@shared_task(bind=True)
def copy_public_to_mydata(self, username, src_resource, src_file_id, dest_resource,
                          dest_file_id):
    logger.debug('Scheduled copy of files from %s://%s to %s://%s',
                 src_resource, src_file_id, dest_resource, dest_file_id)

    try:
        n = Notification(event_type = 'data',
                         status = 'INFO',
                         operation = 'copy_public_to_mydata_start',
                         message = 'Copying folder/files %s from public data to your private data. Please wait...' % (src_file_id, ),
                         user = username,
                         extra={
                                'system': dest_resource,
                                'id': dest_file_id,
                            })
                         # extra = {'target_path': '%s%s' %(reverse('designsafe_data:data_depot'), src_file_id)})
        n.save()
        notify_status = 'SUCCESS'
        from designsafe.apps.api.data import lookup_file_manager
        source_fm_cls = lookup_file_manager(src_resource)
        dest_fm_cls = lookup_file_manager(dest_resource)

        if source_fm_cls and dest_fm_cls:
            user = get_user_model().objects.get(username=username)
            source_fm = source_fm_cls(user)
            dest_fm = dest_fm_cls(user)
            source_real_path = source_fm.get_file_real_path(src_file_id)
            dirname = os.path.basename(source_real_path)
            dest_real_path = os.path.join(dest_fm.get_file_real_path(dest_file_id),
                                          dirname)
            if os.path.isdir(source_real_path):
                shutil.copytree(source_real_path, dest_real_path)
            elif os.path.isfile(source_real_path):
                shutil.copy(source_real_path, dest_real_path)
            else:
                notify_status = 'ERROR'
                logger.error('The request copy source=%s does not exist!', src_resource)

            system, username, path = dest_fm.parse_file_id(dest_file_id)
            dest_fm.indexer.index(system, path, username, levels = 1)

            n = Notification(event_type = 'data',
                             status = notify_status,
                             operation = 'copy_public_to_mydata_end',
                             message = 'Files were copied to your private data.',
                             user = username,
                             extra={
                                'system': dest_resource,
                                'id': dest_file_id,
                            })
                             # extra = {'target_path': '%s%s' %(reverse('designsafe_data:data_depot'), dest_file_id)})
            n.save()
        else:
            logger.error('Unable to load file managers for both source=%s and destination=%s',
                         src_resource, dest_resource)

            n = Notification(event_type = 'data',
                             status = 'ERROR',
                             operation = 'copy_public_to_mydata_error',
                             message = '''There was an error copying the files to your public data.
                                          Plese try again.''',
                             user = username,
                             extra={
                                'system': dest_resource,
                                'id': dest_file_id,
                            })
                             # extra = {})
            n.save()
    except:
        logger.exception('Unexpected task failure')

        n = Notification(event_type = 'data',
                         status = 'ERROR',
                         operation = 'copy_public_to_mydata_error',
                         message = '''There was an error copying the files to your public data.
                                      Plese try again.''',
                         user = username,
                         extra={
                                'system': dest_resource,
                                'id': dest_file_id,
                        })
                         # extra = {})
        n.save()

@shared_task(bind=True)
def external_resource_upload(self, username, dest_resource, src_file_id, dest_file_id):
    """
    :param self:
    :param username:
    :param dest_resource:
    :param src_file_id:
    :param dest_file_id:
    :return:
    """
    logger.debug('Initializing external_resource_upload. username: %s, src_file_id: %s, dest_resource: %s, dest_file_id: %s ', username, src_file_id, dest_resource, dest_file_id)

    from designsafe.apps.api.external_resources.box.filemanager.manager \
            import FileManager as BoxFileManager
    from designsafe.apps.api.external_resources.dropbox.filemanager.manager \
            import FileManager as DropboxFileManager
    from designsafe.apps.api.external_resources.googledrive.filemanager.manager \
            import FileManager as GoogleDriveFileManager

    user = get_user_model().objects.get(username=username)

    if dest_resource == 'box':
        fmgr = BoxFileManager(user)
    elif dest_resource == 'dropbox':
        fmgr = DropboxFileManager(user)
    elif dest_resource == 'googledrive':
        fmgr = GoogleDriveFileManager(user)

    logger.debug('fmgr.upload( %s, %s, %s)', username, src_file_id, dest_file_id)
    fmgr.upload(username, src_file_id, dest_file_id)
    # try:
    #     n = Notification(event_type='data',
    #                      status=Notification.INFO,
    #                      operation='box_upload_start',
    #                      message='Starting uploading file %s to box.' % (src_file_id,),
    #                      user=username,
    #                      extra={})
    #     n.save()
    #     user = get_user_model().objects.get(username=username)

    #     from designsafe.apps.api.external_resources.box.filemanager.manager import \
    #          FileManager as BoxFileManager
    #     from designsafe.apps.api.agave.filemanager.agave import AgaveFileManager
    #     # Initialize agave filemanager
    #     agave_fm = AgaveFileManager(agave_client=user.agave_oauth.client)
    #     # Split src ination file path
    #     src_file_path_comps = src_file_id.strip('/').split('/')
    #     # If it is an agave file id then the first component is a system id
    #     agave_system_id = src_file_path_comps[0]
    #     # Start construction the actual real path into the NSF mount
    #     if src_file_path_comps[1:]:
    #         src_real_path = os.path.join(*src_file_path_comps[1:])
    #     else:
    #         src_real_path = '/'
    #     # Get what the system id maps to
    #     base_mounted_path = agave_fm.base_mounted_path(agave_system_id)
    #     # Add actual path
    #     if re.search(r'^project-', agave_system_id):
    #         project_dir = agave_system_id.replace('project-', '', 1)
    #         src_real_path = os.path.join(base_mounted_path, project_dir, src_real_path.strip('/'))
    #     else:
    #         src_real_path = os.path.join(base_mounted_path, src_real_path.strip('/'))
    #     logger.debug('src_real_path: {}'.format(src_real_path))

    #     box_fm = BoxFileManager(user)
    #     box_file_type, box_file_id = box_fm.parse_file_id(file_id=dest_file_id.strip('/'))
    #     if os.path.isfile(src_real_path):
    #         box_upload_file(box_fm, box_file_id, src_real_path)
    #     elif os.path.isdir(src_real_path):
    #         box_upload_directory(box_fm, box_file_id, src_real_path)
    #     else:
    #         logger.error('Unable to upload %s: file does not exist!',
    #                      src_real_path)

    #     n = Notification(event_type='data',
    #                      status=Notification.SUCCESS,
    #                      operation='box_upload_end',
    #                      message='File %s has been copied to box successfully!' % (src_file_id, ),
    #                      user=username,
    #                      extra={})
    #     n.save()
    # except Exception as err:
    #     logger.exception('Unexpected task failure: box_upload', extra={
    #         'username': username,
    #         'src_file_id': src_file_id,
    #         'dst_file_id': dest_file_id
    #     })
    #     n = Notification(event_type='data',
    #                      status=Notification.ERROR,
    #                      operation='box_upload_error',
    #                      message='We were unable to get the specified file from box. '
    #                              'Please try again...',
    #                      user=username,
    #                      extra={})
    #     n.save()
    #     raise

@shared_task(bind=True)
def external_resource_download(self, file_mgr_name, username, src_file_id, dest_file_id):
    """
    :param self:
    :param username:
    :param src_file_id:
    :param dest_file_id:
    :return:
    """
    logger.debug('Downloading %s://%s for user %s to %s',
                 file_mgr_name, src_file_id, username, dest_file_id)

    from designsafe.apps.api.external_resources.box.filemanager.manager \
            import FileManager as BoxFileManager
    from designsafe.apps.api.external_resources.dropbox.filemanager.manager \
            import FileManager as DropboxFileManager
    from designsafe.apps.api.external_resources.googledrive.filemanager.manager \
            import FileManager as GoogleDriveFileManager

    user = get_user_model().objects.get(username=username)

    if file_mgr_name == 'box':
        fmgr = BoxFileManager(user)
    elif file_mgr_name == 'dropbox':
        fmgr = DropboxFileManager(user)
    elif file_mgr_name == 'googledrive':
        fmgr = GoogleDriveFileManager(user)

    fmgr.copy(username, src_file_id, dest_file_id)

    # try:
    #     n = Notification(event_type='data',
    #                      status=Notification.INFO,
    #                      operation='box_download_start',
    #                      message='Starting download file %s from box.' % (src_file_id,),
    #                      user=username,
    #                      extra={})
    #     n.save()
    #     logger.debug('username: {}, src_file_id: {}, dest_file_id: {}'.format(username, src_file_id, dest_file_id))
    #     user = get_user_model().objects.get(username=username)

    #     from designsafe.apps.api.external_resources.box.filemanager.manager import \
    #          FileManager as BoxFileManager
    #     from designsafe.apps.api.agave.filemanager.agave import AgaveFileManager
    #     # Initialize agave filemanager
    #     agave_fm = AgaveFileManager(agave_client=user.agave_oauth.client)
    #     # Split destination file path
    #     dest_file_path_comps = dest_file_id.strip('/').split('/')
    #     # If it is an agave file id then the first component is a system id
    #     agave_system_id = dest_file_path_comps[0]
    #     # Start construction the actual real path into the NSF mount
    #     if dest_file_path_comps[1:]:
    #         dest_real_path = os.path.join(*dest_file_path_comps[1:])
    #     else:
    #         dest_real_path = '/'
    #     # Get what the system id maps to
    #     base_mounted_path = agave_fm.base_mounted_path(agave_system_id)
    #     # Add actual path
    #     if re.search(r'^project-', agave_system_id):
    #         project_dir = agave_system_id.replace('project-', '', 1)
    #         dest_real_path = os.path.join(base_mounted_path, project_dir, dest_real_path.strip('/'))
    #     else:
    #         dest_real_path = os.path.join(base_mounted_path, dest_real_path.strip('/'))
    #     logger.debug('dest_real_path: {}'.format(dest_real_path))

    #     box_fm = BoxFileManager(user)
    #     box_file_type, box_file_id = box_fm.parse_file_id(file_id=src_file_id)

    #     levels = 0
    #     downloaded_file_path = None
    #     if box_file_type == 'file':
    #         downloaded_file_path = box_fm.download_file(box_file_id, dest_real_path)
    #         levels = 1
    #     elif box_file_type == 'folder':
    #         downloaded_file_path = box_fm.download_folder(box_file_id, dest_real_path)

    #     #if downloaded_file_path is not None:
    #     #    downloaded_file_id = agave_fm.from_file_real_path(downloaded_file_path)
    #     #    system_id, file_user, file_path = agave_fm.parse_file_id(downloaded_file_id)

    #     n = Notification(event_type='data',
    #                      status=Notification.SUCCESS,
    #                      operation='box_download_end',
    #                      message='File %s has been copied from box successfully!' % (src_file_id, ),
    #                      user=username,
    #                      extra={})
    #     n.save()
    #     if re.search(r'^project-', agave_system_id):
    #         project_dir = agave_system_id.replace('project-', '', 1)
    #         project_dir = os.path.join(base_mounted_path.strip('/'), project_dir)
    #         agave_file_path = downloaded_file_path.replace(project_dir, '', 1).strip('/')
    #     else:
    #         agave_file_path = downloaded_file_path.replace(base_mounted_path, '', 1).strip('/')

    #     reindex_agave.apply_async(kwargs={
    #                               'username': user.username,
    #                               'file_id': '{}/{}'.format(agave_system_id, agave_file_path)
    #                               })
    # except:
    #     logger.exception('Unexpected task failure: box_download', extra={
    #         'username': username,
    #         'box_file_id': src_file_id,
    #         'dest_file_id': dest_file_id
    #     })
    #     n = Notification(event_type='data',
    #                      status=Notification.ERROR,
    #                      operation='box_download_error',
    #                      message='We were unable to get the specified file from box. '
    #                              'Please try again...',
    #                      user=username,
    #                      extra={})
    #     n.save()
    #     raise

@shared_task(bind=True)
def check_project_files_meta_pems(self, project_uuid):
    from designsafe.apps.data.models.agave.files import BaseFileMetadata
    logger.debug('Checking metadata pems linked to a project')
    service = get_service_account_client()
    metas = BaseFileMetadata.search(service, {'associationIds': project_uuid})
    for meta in metas:
        logger.debug('checking %s:%s', meta.uuid, meta.name)
        meta.match_pems_to_project(project_uuid)

@shared_task(bind=True)
def check_project_meta_pems(self, metadata_uuid):
    from designsafe.apps.data.models.agave.files import BaseFileMetadata
    logger.debug('Checking single metadata pems linked to a project %s', metadata_uuid)
    service = get_service_account_client()
    bfm = BaseFileMetadata.from_uuid(service, metadata_uuid)
    bfm.match_pems_to_project()

@shared_task(bind=True)
def set_project_id(self, project_uuid):
    from designsafe.apps.projects.models.agave.experimental import ExperimentalProject
    logger.debug('Setting project ID')
    service = get_service_account_client()
    project = ExperimentalProject._meta.model_manager.get(service, project_uuid)
    id_metas = service.meta.listMetadata(q='{"name": "designsafe.project.id"}')
    logger.debug(json.dumps(id_metas, indent=4))
    if not len(id_metas):
        raise Exception('No project Id found')

    id_meta = id_metas[0]
    project_id = int(id_meta['value']['id'])
    project_id = project_id + 1
    for i in range(10):
        _projs = service.meta.listMetadata(q='{{"name": "designsafe.project", "value.projectId": {} }}'.format(project_id))
        if len(_projs):
            project_id = project_id + 1
    
    project.project_id = 'PRJ-{}'.format(str(project_id))
    project.save(service)
    logger.debug('updated project id=%s', project.uuid)
    id_meta['value']['id'] = project_id
    new_metadata = service.meta.updateMetadata(body=id_meta, uuid=id_meta['uuid'])
    logger.debug('updated id record=%s', id_meta['uuid'])

    index_or_update_project.apply_async(args=[project.uuid], queue='api')

@shared_task(bind=True)
def index_or_update_project(self, uuid):
    """
    Takes a project UUID and either creates a new document in the 
    des-projects index or updates the document if one already exists for that
    project.
    """
    from designsafe.apps.api.projects.models import Project

    client = get_service_account_client()
    project_model = Project(client)
    project = project_model.search({'uuid': uuid}, client)[0]
    project_meta = project.to_dict()

    to_index = {key: value for key, value in project_meta.iteritems() if key != '_links'}
    to_index['value'] = {key: value for key, value in project_meta['value'].iteritems() if key != 'teamMember'}

    project_search = IndexedProject.search().filter(
        Q({'term': 
            {'uuid._exact': uuid}
        })
    )
    res = project_search.execute()

    if res.hits.total == 0:
        # Create an ES record for the new metadata.
        # project_info_args = {key:value for key,value in project_info.iteritems() if key != '_links'}
        project_ES = IndexedProject(**to_index)
        project_ES.save()
    elif res.hits.total == 1:
        # Update the record.
        doc = res[0]
        doc.update(**to_index)
    else:
        # If we're here we've somehow indexed the same project multiple times. 
        # Delete all records and replace with the metadata passed to the task.
        for doc in res:
            doc.delete()
        project_ES = IndexedProject(**to_index) 
        project_ES.save()

@shared_task(bind=True)
def reindex_projects(self):
    """
    Performs a listing of all projects using the service account client, then 
    indexes each project using the index_or_update_project task.
    """
    client = get_service_account_client()
    query = {'name': 'designsafe.project'}

    in_loop = True
    offset = 0
    while in_loop:
        listing = client.meta.listMetadata(q=json.dumps(query), offset=offset, limit=100)
        offset += 100

        if len(listing) == 0:
            in_loop = False
        else:
            for project in listing:
                index_or_update_project.apply_async(args=[project.uuid], queue='api')

@shared_task(bind=True, max_retries=5)
def copy_publication_files_to_corral(self, project_id):
    from designsafe.apps.api.agave.filemanager.public_search_index import Publication
    import shutil
    publication = Publication(project_id=project_id)
    filepaths = publication.related_file_paths()
    if not len(filepaths):
        res = get_service_account_client().files.list(
            systemId='project-{project_uuid}'.format(
                project_uuid=publication.project.uuid
            ),
            filePath='/'
        )
        filepaths = [
            _file.path.strip('/') for _file in res if (
                _file.name != '.' and _file.name != 'Trash'
            )
        ]

    filepaths = list(set(filepaths))
    filepaths = sorted(filepaths)
    base_path = ''.join(['/', publication.projectId])
    os.chmod('/corral-repl/tacc/NHERI/published', 0755)
    prefix_dest = '/corral-repl/tacc/NHERI/published/{}'.format(project_id)
    if not os.path.isdir(prefix_dest):
        os.mkdir(prefix_dest)

    prefix_src = '/corral-repl/tacc/NHERI/projects/{}'.format(publication.project['uuid'])
    for filepath in filepaths:
        local_src_path = '{}/{}'.format(prefix_src, filepath)
        local_dst_path = '{}/{}'.format(prefix_dest, filepath)
        logger.info('Trying to copy: %s to %s', local_src_path, local_dst_path)
        if os.path.isdir(local_src_path):
            try:
                #os.mkdir(local_dst_path)
                if not os.path.isdir(os.path.dirname(local_dst_path)):
                    os.makedirs(os.path.dirname(local_dst_path))
                shutil.copytree(local_src_path, local_dst_path)
                for root, dirs, files in os.walk(local_dst_path):
                    for d in dirs:
                        os.chmod(os.path.join(root, d), 0555)
                    for f in files:
                        os.chmod(os.path.join(root, f), 0444)
                os.chmod(local_dst_path, 0555)
            except OSError as exc:
                logger.info(exc)
            except IOError as exc:
                logger.info(exc)
        else:
            try:
                if not os.path.isdir(os.path.dirname(local_dst_path)):
                    os.makedirs(os.path.dirname(local_dst_path))
                for root, dirs, files in os.walk(os.path.dirname(local_dst_path)):
                    for d in dirs:
                        os.chmod(os.path.join(root, d), 0555)
                    for f in files:
                        os.chmod(os.path.join(root, f), 0444)

                shutil.copy(local_src_path, local_dst_path)
                os.chmod(local_dst_path, 0444)
            except OSError as exc:
                logger.info(exc)
            except IOError as exc:
                logger.info(exc)

    os.chmod(prefix_dest, 0555)
    os.chmod('/corral-repl/tacc/NHERI/published', 0555)
    save_to_fedora.apply_async(args=[project_id])
    agave_indexer.apply_async(kwargs={'username': 'ds_admin', 'systemId': 'designsafe.storage.published', 'filePath': '/' + project_id, 'recurse':True}, queue='indexing')

@shared_task(bind=True, max_retries=1, default_retry_delay=60)
def save_publication(self, project_id):
    from designsafe.apps.api.agave.filemanager.public_search_index import Publication  
    from designsafe.apps.api.projects.managers import publication as PublicationManager
    try:
        pub = Publication(project_id=project_id)
        publication = PublicationManager.reserve_publication(pub.to_dict())
        pub.update(**publication)
    except Exception as exc:
        logger.error('Proj Id: %s. %s', project_id, exc, exc_info=True)
        raise self.retry(exc=exc)

@shared_task(bind=True)
def zip_project_files(self, project_uuid):
    from designsafe.apps.projects.models.agave.base import Project
    from designsafe.apps.api.agave import get_service_account_client

    try:
        ag = get_service_account_client()
        proj = Project.manager().get(ag, uuid=project_uuid)
        proj.archive()
    except Exception as exc:
        logger.error('Zip Proj UUID: %s. %s', project_uuid, exc, exc_info=True)
        raise self.retry(exc=exc)

@shared_task(bind=True)
def zip_publication_files(self, project_id):
    from designsafe.apps.api.agave.filemanager.public_search_index import Publication

    try:
        pub = Publication(project_id=project_id)
        pub.archive()
    except Exception as exc:
        logger.error('Zip Proj Id: %s. %s', project_id, exc, exc_info=True)
        raise self.retry(exc=exc)

@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def save_to_fedora(self, project_id):
    import requests
    import magic
    from designsafe.apps.api.agave.filemanager.public_search_index import Publication  
    try:
        pub = Publication(project_id=project_id)
        pub.update(status='published')
        _root = os.path.join('/corral-repl/tacc/NHERI/published', project_id)
        fedora_base = 'http://fedoraweb01.tacc.utexas.edu:8080/fcrepo/rest/publications_01'
        res = requests.get(fedora_base)
        if res.status_code == 404 or res.status_code == 410:
            requests.put(fedora_base)
        
        fedora_project_base = ''.join([fedora_base, '/', project_id])
        res = requests.get(fedora_project_base)
        if res.status_code == 404 or res.status_code == 410:
            requests.put(fedora_project_base)

        headers = {'Content-Type': 'text/plain'}
        #logger.debug('walking: %s', _root)
        for root, dirs, files in os.walk(_root):
            for name in files:
                mime = magic.Magic(mime=True)
                headers['Content-Type'] = mime.from_file(os.path.join(root, name))
                #files
                full_path = os.path.join(root, name)
                _path = full_path.replace(_root, '', 1)
                _path = _path.replace('[', '-')
                _path = _path.replace(']', '-')
                url = ''.join([fedora_project_base, urllib.quote(_path)])
                #logger.debug('uploading: %s', url)
                with open(os.path.join(root, name), 'rb') as _file:
                    requests.put(url, data=_file, headers=headers)

            for name in dirs:
                #dirs
                full_path = os.path.join(root, name)
                _path = full_path.replace(_root, '', 1)
                url = ''.join([fedora_project_base, _path])
                #logger.debug('creating: %s', _path)
                requests.put(url)

    except Exception as exc:
        logger.error('Proj Id: %s. %s', project_id, exc)
        raise self.retry(exc=exc)

@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def set_facl_project(self, project_uuid, usernames):
    client = get_service_account_client()
    for username in usernames:
        job_body = {
            'inputs': {
                'username': username,
                'directory': 'projects/{}'.format(project_uuid)
            },
            'name': 'setfacl',
            'appId': 'setfacl_corral3-0.1'
        }
        res = client.jobs.submit(body=job_body)
        logger.debug('set facl project: {}'.format(res))

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def email_collaborator_added_to_project(self, project_title, team_members_to_add, co_pis_to_add):

    for username in team_members_to_add + co_pis_to_add:
        collab_users = get_user_model().objects.filter(username=username)
        if collab_users:
            for collab_user in collab_users:
                logger.debug('this is the user:'.format(collab_user))
                try:
                    collab_user.profile.send_mail("You have been added to a DesignSafe project!", '''\
                        Hi {},
                        You have been added to the project {}.
                        You can now start working on the project. Please use your TACC account to access the DesignSafe-CI website or to ask for help.
                        <This is a programmatically generated message. Do NOT reply to this message.>
                        Thanks, The DesignSafe-CI team"\
                        '''.format(collab_user.get_full_name(), project_title))
                except DesignSafeProfile.DoesNotExist as err:
                    logger.info("Could not send email to user %s", collab_user)
