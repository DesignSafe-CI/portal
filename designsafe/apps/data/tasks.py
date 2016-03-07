from __future__ import absolute_import

from celery import shared_task
from designsafe.celery import app
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from designsafe.libs.elasticsearch.api import Object
from dsapi.agave import utils as agave_utils
from dsapi.agave.daos import AgaveMetaFolderFile, FileManager, AgaveFolderFile
from designsafe.apps.data.apps import DataEvent
from designsafe.apps.signals.signals import generic_event
from agavepy.agave import Agave
import logging

logger = logging.getLogger(__name__)


@shared_task
def index_job_outputs(data):
    logger.debug('Preparing to index Job outputs: %s' % data)

    job_owner = data['job_owner']
    job_id = data['job_id']

    if data['status'] == 'INDEXING':
        try:
            user = get_user_model().objects.get(username=job_owner)
            if user.agave_oauth.expired:
                user.agave_oauth.refresh()
            ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                       token=user.agave_oauth.token['access_token'])
            job = ag.jobs.get(jobId=job_id)
            system_id = job['archiveSystem']
            archive_path = job['archivePath']
            #base_file = ag.files.list(systemId=system_id, filePath=archive_path)
            # the listing returns "name"="." for the first folder in the list
            # we need the actual folder name
            #base_file[0]['name'] = base_file[0]['path'].split('/')[-1]
            #get_or_create_from_file(ag, base_file[0])
            for f in agave_utils.fs_walk(ag, system_id, archive_path):
                fo = agave_utils.get_folder_obj(agave_client = ag, file_obj = f)
                logger.debug('Indexing: {}'.format(fo.full_path))
                o = Object(**fo.to_dict())
                o.save()

            paths = archive_path.split('/')
            for i in range(len(paths)):
                path = '/'.join(paths)
                fo = AgaveFolderFile.from_path(ag, system_id, path)
                logger.debug('Indexing: {}'.format(fo.full_path))
                o = Object(**fo.to_dict())
                o.save()
                paths.pop()

            data['status']='FINISHED'
            data['event']='FINISHED'

            index=next((i for i,x in enumerate(data['html']) if 'Status' in x),None)
            data['html'][index]={'Status': 'FINISHED'}


            db_hash = archive_path.replace(job_owner, '')
            data['action_link']={'label': 'View Output', 'value': '%s#%s' % (reverse('designsafe_data:my_data'), db_hash)}

            del data['event_type']
            del data['users']
            generic_event.send_robust(None, event_type='job', event_data=data,
                                      event_users=[job_owner])
            logger.info('data with action link: {}'.format(str(data)))

        except ObjectDoesNotExist:
            logger.exception('Unable to locate local user=%s' % job_owner)

@app.task
def share(system_id, path, username, permission, me):
    logger.debug('Sharing file/folder: {}. To: {}. Owner: {}'.format(path, username, me))
    path_shared = path
    try:
        user = get_user_model().objects.get(username=me)
        if user.agave_oauth.expired:
            user.agave_oauth.refresh()
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token = user.agave_oauth.token['access_token'])
        mngr = FileManager(agave_client = ag)
        rep = mngr.share(system_id = system_id, path = path,
                  username = username, permission = permission,
                  me = me)
        meta_obj, ret = mngr.get(system_id, path, me, False)
        if meta_obj.format != 'folder':
            path_shared = meta_obj.path
        logger.debug('Successfully updated permissions: {}'.format(rep))

        DataEvent.send_generic_event({
                  'username_from': me,
                  'username_to': username,
                  'permission': permission,
                  'action': 'share_finished',
                  'path': path,
                  'action_link': { 'label': 'View Files', 'value': '/data/my/#/Shared with me/' + path_shared},
                  'html':[
                      {'Message': 'Your files have been shared.'},
                      {'Action': 'Sharing Finished'},
                      {'Shared with': username},
                      {'Permissions set': permission},
                      ]
                  },
                  [me])

        DataEvent.send_generic_event({
                  'username_from': me,
                  'username_to': username,
                  'permission': permission,
                  'action': 'share_finished',
                  'path': path,
                  'action_link': { 'label': 'View Files', 'value': '/data/my/#/Shared with me/' + path_shared},
                  'html':[
                      {'Message': '{} have shared some files with you.'.format(me)},
                      {'Action': 'Sharing Finished'},
                      {'Shared with': username},
                      {'Permissions set': permission},
                      ]
                  },
                  [username])
    except ObjectDoesNotExist:
        logger.exception('Unable to locate local user=%s' % job_owner)
