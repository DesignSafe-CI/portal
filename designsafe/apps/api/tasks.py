import shutil
import logging
import re
import os
import sys
import json
import urllib.request, urllib.parse, urllib.error
from datetime import datetime
from celery import shared_task
from django.core.urlresolvers import reverse
from django.contrib.auth import get_user_model
from django.conf import settings
from requests.exceptions import HTTPError

from designsafe.apps.api.notifications.models import Notification, Broadcast
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.projects.models.elasticsearch import IndexedProject
from designsafe.apps.data.models.elasticsearch import IndexedPublication
from designsafe.libs.elasticsearch.docs.publications import BaseESPublication
from designsafe.libs.elasticsearch.utils import new_es_client
from designsafe.apps.data.tasks import agave_indexer
from elasticsearch_dsl.query import Q
from elasticsearch.helpers import bulk
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

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
    safe_filename = box_file.name
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
    safe_dirname = box_folder.name
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

    return str(project_id)

@shared_task(bind=True)
def index_or_update_project(self, uuid):
    """
    Takes a project UUID and either creates a new document in the 
    des-projects index or updates the document if one already exists for that
    project.
    """
    client = get_service_account_client() 
    query = {'uuid': uuid}
    listing = client.meta.listMetadata(q=json.dumps(query), offset=0, limit=1)
    index_projects_listing(listing)


def index_projects_listing(projects):
    """
    Index the result of an Agave projects listing

    Parameters
    ----------
    projects: list
        list of project metadata objects (either dict or agavepy.agave.Attrdict)

    Returns
    -------
    Void
    """
    from designsafe.apps.projects.models.elasticsearch import IndexedProject
    idx = IndexedProject.Index.name
    client = IndexedProject._get_connection()
    ops = []
    for _project in projects:
        # Iterate through projects and construct a bulk indexing operation.

        project_dict = dict(_project)
        project_dict = {key: value for key, value in project_dict.items() if key != '_links'}
        award_number = project_dict['value'].get('awardNumber', []) 
        if not isinstance(award_number, list):
            award_number = [{'number': project_dict['value']['awardNumber'] }]
        if not all(isinstance(el, dict) for el in award_number):
            # Punt if the list items are some type other than dict.
            award_number = []
        project_dict['value']['awardNumber'] = award_number

        if project_dict['value'].get('guestMembers', []) == [None]:
            project_dict['value']['guestMembers'] = []
        if project_dict['value'].get('nhEventStart', []) == '':
            project_dict['value']['nhEventStart'] = None
        if project_dict['value'].get('nhEventEnd', []) == '':
            project_dict['value']['nhEventEnd'] = None

        ops.append({
            '_index': idx,
            '_id': project_dict['uuid'],
            'doc': project_dict,
            '_op_type': 'update',
            'doc_as_upsert': True
            })

    bulk(client, ops)


def list_all_projects(offset=0, limit=100):
    """
    Iterate through all projects, yielding 100 (or some defined o) at a time.

    Parameters
    ----------
    offset: int
        Offset to begin iteration at.
    limit: int
        Number of project metadata items returned per listing

    Yields
    ------
    agavepy.agave.Attrdict
    """
    client = get_service_account_client()
    query = {'name': 'designsafe.project'}
    while True:
        listing = client.meta.listMetadata(q=json.dumps(query), offset=offset, limit=limit)
        offset += limit
        yield listing
        if len(listing) < limit:
            break


@shared_task(bind=True)
def reindex_projects(self):
    """
    Index all project metadata.

    Returns
    -------
    Void
    """
    for listing in list_all_projects():
        try:
            index_projects_listing(listing)
        except Exception as e:
            logger.exception(e)


@shared_task(bind=True, max_retries=5)
def copy_publication_files_to_corral(self, project_id, revision=None, selected_files=None):
    """
    Takes a project ID and copies project files to a published directory.

    :param str project_id: Project ID
    :param int revision: The revision number of the publication
    :param list of selected_files strings: Only provided if project type == other.
    """
    if getattr(settings, 'DESIGNSAFE_ENVIRONMENT', 'dev') == 'dev':
        return

    es_client = new_es_client()
    publication = BaseESPublication(project_id=project_id, revision=revision, using=es_client)

    filepaths = publication.related_file_paths()
    if not len(filepaths) and selected_files:
        # Project is "Other" so we just copy the selected files
        filepaths = [
            file_path.strip('/') for file_path in selected_files if (file_path != '.Trash')
        ]

    filepaths = list(set(filepaths))
    filepaths = sorted(filepaths)
    base_path = ''.join(['/', publication.projectId])
    os.chmod('/corral-repl/tacc/NHERI/published', 0o755)
    prefix_dest = '/corral-repl/tacc/NHERI/published/{}'.format(project_id)
    if revision:
        prefix_dest += 'v{}'.format(revision)
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
                        os.chmod(os.path.join(root, d), 0o555)
                    for f in files:
                        os.chmod(os.path.join(root, f), 0o444)
                os.chmod(local_dst_path, 0o555)
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
                        os.chmod(os.path.join(root, d), 0o555)
                    for f in files:
                        os.chmod(os.path.join(root, f), 0o444)

                shutil.copy(local_src_path, local_dst_path)
                os.chmod(local_dst_path, 0o444)
            except OSError as exc:
                logger.info(exc)
            except IOError as exc:
                logger.info(exc)

    os.chmod(prefix_dest, 0o555)
    os.chmod('/corral-repl/tacc/NHERI/published', 0o555)

    save_to_fedora.apply_async(args=[project_id, revision])

    index_path = '/' + project_id
    if revision:
        index_path += 'v{}'.format(revision)
    agave_indexer.apply_async(kwargs={'username': 'ds_admin', 'systemId': 'designsafe.storage.published', 'filePath': index_path, 'recurse':True}, queue='indexing')


@shared_task(bind=True, max_retries=1, default_retry_delay=60)
def freeze_publication_meta(self, project_id, entity_uuids=None, revision=None, revised_authors=None):
    """Freeze publication meta.

    :param str project_id: Project Id.
    :param str entity_uuid: Entity uuid.
    """
    from designsafe.apps.projects.managers import publication as PublicationManager
    try:
        PublicationManager.freeze_project_and_entity_metadata(
            project_id,
            entity_uuids,
            revision,
            revised_authors
        )
    except Exception as exc:
        logger.error('Proj Id: %s. %s', project_id, exc, exc_info=True)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=1, default_retry_delay=60)
def amend_publication_data(self, project_id, amendments=None, authors=None, revision=None):
    """Amend publication.

    This task will update the published metadata in Elasticsearch and DataCite

    :param str project_id: Project Id.
    :param list of entity_uuid strings: Main entity uuid.
    """
    from designsafe.apps.projects.managers import publication as PublicationManager
    from designsafe.libs.fedora.fedora_operations import amend_project_fedora, ingest_project_experimental
    try:
        amended_pub = PublicationManager.amend_publication(project_id, amendments, authors, revision)
        PublicationManager.amend_datacite_doi(amended_pub)

        if amended_pub.project.value.projectType == 'other':
           amend_project_fedora(project_id, version=revision)
        if amended_pub.project.value.projectType == 'experimental':
            ingest_project_experimental(project_id, version=revision, amend=True)
    except Exception as exc:
        logger.error('Proj Id: %s. %s', project_id, exc, exc_info=True)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=1, default_retry_delay=60)
def save_publication(self, project_id, entity_uuids=None, revision=None, revised_authors=None):
    """Save publication.

    This task will create a draft DOI and copy all metadata to ES.
    For project types other than 'Other' a main entity uuid *must* be given.

    :param str project_id: Project Id.
    :param list of entity_uuid strings: Main entity uuid.
    """
    from designsafe.apps.projects.managers import publication as PublicationManager
    try:
        PublicationManager.draft_publication(
            project_id,
            entity_uuids,
            revision=revision,
            revised_authors=revised_authors
        )
        # TODO: Why are we running this here if we're already calling it in the task chain?
        PublicationManager.freeze_project_and_entity_metadata(
            project_id,
            entity_uuids,
            revision=revision,
            revised_authors=revised_authors
        )
    except Exception as exc:
        logger.error('Proj Id: %s. %s', project_id, exc, exc_info=True)
        raise self.retry(exc=exc)

@shared_task(bind=True)
def zip_publication_files(self, project_id, revision=None):
    from designsafe.apps.projects.managers import publication as PublicationManager
    try:
        PublicationManager.archive(project_id=project_id, revision=revision)
    except Exception as exc:
        logger.error('Zip Proj Id: %s. %s', project_id, exc, exc_info=True)
        raise self.retry(exc=exc)

@shared_task(bind=True)
def swap_file_tag_uuids(self, project_id, revision=None):
    """Swap File Tag UUID's

    This task will update each file tag's file uuid from the file in
    the project directory to the copied file in the published storage system

    :param str project_id: Project Id.
    """
    from designsafe.apps.projects.managers import publication as PublicationManager
    try:
        PublicationManager.fix_file_tags(project_id, revision=revision)
    except Exception as exc:
        logger.error('File Tag Correction Error: %s. %s', project_id, exc, exc_info=True)
        raise self.retry(exc=exc)

@shared_task(bind=True)
def set_publish_status(self, project_id, entity_uuids=None, publish_dois=False, revision=None):
    from designsafe.apps.projects.managers import publication as PublicationManager
    # Only publish DOIs created from prod
    if getattr(settings, 'DESIGNSAFE_ENVIRONMENT', 'dev') == 'default':
        publish_dois = True

    PublicationManager.publish_resource(
        project_id,
        entity_uuids,
        publish_dois,
        revision=revision
    )

@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def fedora_ingest_other(self, project_id):
    from designsafe.libs.fedora.fedora_operations import ingest_project
    ingest_project(project_id)

@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def save_to_fedora(self, project_id, revision=None):
    import requests
    import magic
    from designsafe.libs.elasticsearch.docs.publications import BaseESPublication 
    try:
        es_client = new_es_client()
        pub = BaseESPublication(project_id=project_id, revision=revision, using=es_client)
        pub.update(status='published', using=es_client)

        if pub.project.value.projectType == 'other':
           from designsafe.libs.fedora.fedora_operations import ingest_project
           ingest_project(project_id, version=revision)
           return
        if pub.project.value.projectType == 'experimental':
            from designsafe.libs.fedora.fedora_operations import ingest_project_experimental
            ingest_project_experimental(project_id, version=revision)
            return

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
                url = ''.join([fedora_project_base, urllib.parse.quote(_path)])
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
            'parameters': {
                'username': username,
                'directory': 'projects/{}'.format(project_uuid)
            },
            'name': 'setfacl',
            'appId': 'setfacl_corral3-0.1'
        }
        res = client.jobs.submit(body=job_body)
        logger.debug('set facl project: {}'.format(res))

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def email_project_admins(self, project_id, project_uuid, project_title, project_url, username):
    #contact project admins regarding publication of sensitive information
    service = get_service_account_client()
    admins = settings.PROJECT_ADMINS_EMAIL
    user = get_user_model().objects.get(username=username)

    for admin in admins:
        email_body = """
            <p>Hello,</p>
            <p>
                The following Field Research project has been created with the intent of publishing sensitive information:
                <br>
                <b>{prjID} - {title}</b>
            </p>
            <p>
                Contact PI:
                <br>
                {name} - {email}
            </p>
            <p>
                Link to Project:
                <br>
                <a href=\"{url}\">{url}</a>.
            </p>
            This is a programmatically generated message. Do NOT reply to this message.
            """.format(name=user.get_full_name(), email=user.email, title=project_title, prjID=project_id, url=project_url)

        send_mail(
            "DesignSafe PII Alert",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [admin],
            html_message=email_body)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def email_collaborator_added_to_project(self, project_id, project_uuid, project_title, project_url, team_members_to_add, co_pis_to_add):
    service = get_service_account_client()
    for username in team_members_to_add + co_pis_to_add:
        collab_users = get_user_model().objects.filter(username=username)
        if collab_users:
            for collab_user in collab_users:
                email_body = """
                        <p>Hi {name},</p><br>
                        <p>You have been added to the project <b>{title} (ID: {prjID})</b>.</p><br>
                        <p>You can visit the project using the url <a href=\"{url}\">{url}</a>.</p>
                        <p>You can now start working on the project. Please use your TACC account to access the DesignSafe-CI website or to ask for help.</p>
                        <p>Thanks,<br>
                        The DesignSafe-CI Team.<br><br>
                        This is a programmatically generated message. Do NOT reply to this message.
                        """.format(name=collab_user.get_full_name(), title=project_title, prjID=project_id, url=project_url)
                try:
                    collab_user.profile.send_mail("You have been added to a DesignSafe project!", email_body)
                except DesignSafeProfile.DoesNotExist as err:
                    logger.info("Could not send email to user {}".format(collab_user))
                    send_mail(
                        "You have been added to a project!",
                        email_body,
                        settings.DEFAULT_FROM_EMAIL,
                        [collab_user.email],
                        html_message=body)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def email_user_publication_request_confirmation(self, username):
    return
    user = get_user_model().objects.get(username=username)
    email_subject = 'Your DesignSafe Publication Request Has Been Issued'
    email_body = """
    <p>Depending on the size of your data, the publication might take a few minutes or a couple of hours to appear in the <a href=\"{pub_url}\">Published Directory.</a></p>
    <p>During this time, check-in to see if your publication appears.
    If your publication does not appear, is incomplete, or does not have a DOI, <a href=\"{ticket_url}\">please submit a ticket.</a></p>
    <p><strong>Do not</strong> attempt to republish by clicking Request DOI & Publish again.</p>
    <p>This is a programmatically generated message. <strong>Do NOT</strong> reply to this message.
    If you have any feedback or questions, please feel free to <a href=\"{ticket_url}\">submit a ticket.</a></p>
    """.format(pub_url="https://www.designsafe-ci.org/data/browser/public/", ticket_url="https://www.designsafe-ci.org/help/new-ticket/")
    try:
        user.profile.send_mail(email_subject, email_body)
    except Exception as e:
        logger.info("Could not send email to user {}".format(user))
        send_mail(
            email_subject,
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=email_body
        )

@shared_task(bind=True, max_retries=1, default_retry_delay=60)
def check_published_files(project_id, revision=None, selected_files=None):

    # do not attempt to check for files for local publication attempts
    if getattr(settings, 'DESIGNSAFE_ENVIRONMENT', 'dev') != 'default':
        return

    #get list of files that should be in the publication
    es_client = new_es_client()
    publication = BaseESPublication(project_id=project_id, revision=revision, using=es_client)
    if selected_files:
        #it's type other, use this for comparison
        filepaths = selected_files
    else:
        filepaths = publication.related_file_paths()

    #empty dirs
    missing_files = []
    existing_files = []
    empty_folders = []

    #strip leading forward slash from file paths
    updated_filepaths = [
            file_path.strip('/') for file_path in filepaths if (file_path != '.Trash')
        ]

    pub_directory = '/corral-repl/tacc/NHERI/published/{}'.format(project_id)
    if revision:
        pub_directory += 'v{}'.format(revision)

    #navigate through publication files paths and
    #compare to the previous list of files
    for pub_file in updated_filepaths:
        file_to_check = os.path.join(pub_directory, pub_file)
        try:
            if os.path.isfile(file_to_check):
                existing_files.append(pub_file)
            elif os.path.isdir(file_to_check):
                #check directory for items in it
                dir_list = os.listdir(file_to_check)
                if dir_list != []:
                    existing_files.append(pub_file)
                else:
                    empty_folders.append(pub_file)
            else:
                missing_files.append(pub_file)
        except OSError as exc:
            logger.info(exc)

    #send email if there are files/folders missing/empty
    if(missing_files or empty_folders):
        #log for potential later queries
        logger.info("check_published_files missing files: " + project_id + " " + str(missing_files))
        logger.info("check_published_files empty folders: " + project_id + " " + str(empty_folders))

        #send email to dev admins
        service = get_service_account_client()
        prj_admins = settings.DEV_PROJECT_ADMINS_EMAIL
        for admin in prj_admins:
            email_body = """
                <p>Hello,</p>
                <p>
                    The following project has been published with either missing files/folders or empty folders:
                    <br>
                    <b>{prjID} - revision {revision}</b>
                    <br>
                    Path to publication files: {pubFiles}
                </p>
                <p>
                    These are the missing files/folders for this publication:
                    <br>
                    {missingFiles}
                </p>
                <p>
                    These are the empty folders for this publication:
                    <br>
                    {emptyFolders}
                </p>
                This is a programmatically generated message. Do NOT reply to this message.
                """.format(pubFiles=pub_directory, prjID=project_id, missingFiles=missing_files, emptyFolders = empty_folders,revision=revision)

            send_mail(
                "DesignSafe Alert: Published Project has missing files/folders",
                email_body,
                settings.DEFAULT_FROM_EMAIL,
                [admin],
                html_message=email_body)
