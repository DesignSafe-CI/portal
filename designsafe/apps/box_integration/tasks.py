from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.text import get_valid_filename
from celery import shared_task
from designsafe.apps.box_integration import util
from dsapi.agave.daos import FileManager
from boxsdk.exception import BoxAPIException
from agavepy.agave import Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from requests.exceptions import HTTPError
import logging

logger = logging.getLogger(__name__)


def check_connection(username):
    """
    Checks if the user's Box.com connection is working.
    Args:
        username: The username of the User to connection test

    Returns:
        The remote Box.com user record as a dict

    Raises:
        BoxOAuthException: if authentication failed or if token failed to refresh
        BoxException: if other boxsdk errors
        BoxUserToken.DoesNotExist: if token does not exist for user
    """
    user = get_user_model().objects.get(username=username)
    client = util.get_box_client(user)
    box_user = client.user(user_id=u'me').get()
    return box_user


@shared_task(bind=True)
def copy_box_item(self, username, box_item_type, box_item_id, target_system_id,
                  target_path):

    user = get_user_model().objects.get(username=username)
    client = util.get_box_client(user)

    try:
        op = getattr(client, box_item_type)
        item = op(box_item_id).get()
    except AttributeError as e:
        logger.error('Invalid box_item_type')
        self.update_state(state='FAILURE', meta={'exc': e})
        return

    agave_client = user.agave_oauth.client
    fm = FileManager(agave_client=agave_client)

    if box_item_type == 'file':
        try:
            import_url = item.get_shared_link_download_url()
            safe_name = get_valid_filename(item.name)
            import_resp = agave_client.files.importData(systemId=target_system_id,
                                                        filePath=target_path,
                                                        fileName=safe_name,
                                                        urlToIngest=import_url)
            async_resp = AgaveAsyncResponse(agave_client, import_resp)
            async_status = async_resp.result(600)

            if async_status == 'FAILED':
                logger.error('Box File Transfer failed: %s' % target_path)
            else:
                file_path = '%s/%s' % (target_path, item.name)
                logger.info('Indexing Box File Transfer %s' % file_path)
                fm.index(settings.AGAVE_STORAGE_SYSTEM, file_path, username, levels=1)
        except BoxAPIException as e:
            logger.error('Unable to get download link from Box')
            self.update_state(state='FAILURE', meta={'exc': e})
        except HTTPError as e:
            logger.error('Agave.files.importData raised HTTPError')
            self.update_state(state='FAILURE', meta={'exc': e})
        except (TimeoutError, Error) as e:
            logger.error('Agave.files.importData failed to complete')
            self.update_state(state='FAILURE', meta={'exc': e})

    else:  # box_item_type == 'folder'

        # create directory for the folder
        try:
            safe_name = get_valid_filename(item.name)
            mf, f = fm.mkdir(target_path, safe_name, target_system_id, username,
                             raise_if_exists=False)
            logger.info('Created directory "{0}"; scheduling transfer of contents',
                        f.full_path)
        except HTTPError as e:
            logger.error('Agave.files.manage(mkdir) failed')
            self.update_state(state='FAILURE', meta={'exc': e})

        # schedule to copy all of it's items
        limit = 10
        offset = 0
        while True:
            item_collection = item.get_items(limit=limit, offset=offset)
            for it in item_collection:
                args = (username, it.type, it.object_id, target_system_id,
                        f.full_path)
                copy_box_item.apply_async(args=args, countdown=offset*2)
            if len(item_collection) == limit:
                offset += limit
            else:
                break

