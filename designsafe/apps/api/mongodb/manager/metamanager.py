import logging
import json
from designsafe.apps.api.mongodb.utils import mongo_client
from django.http import JsonResponse
from django.http import HttpResponseBadRequest, HttpResponseForbidden
from requests import HTTPError

logger = logging.getLogger(__name__)


class MongoMetaManager():

    def __init__(self, collection):
        """
        Set collection for the mongo database (files, projects, publications etc...)
        Client info will need to be completed with user info...
        For now we just use admin
        """
        self._mc = mongo_client()['api'][collection]


    # @property
    # def requires_auth(self):
    #     """
    #     May not keep this...
    #     """
    #     return True


    # def list_permissions():
    #     """
    #     Get permissions of current user
    #     """
    #     return 'list permissions'


    def get_file_doc(self, system_id, file_path):
        """
        Get file metadata document for a file
        """
        file_meta = self._mc.find_one({'system': system_id, 'path': file_path})
        if file_meta:
            file_meta['_id'] = str(file_meta['_id'])
            return file_meta
        else:
            return file_meta


    def list_file_docs(self, system_id, file_path):
        """
        Get file metadata documents for all files in a given system and file path
        """
        return 'file_metas'


    def create_file_doc(self, body, system_id, file_path):
        """
        Create/Update a file metadata document

        Note: Might be an issue if a file is uploaded to same exact path...
        """
        meta_check = self._mc.find_one({'system': system_id, 'path': file_path})
        if meta_check:
            try:
                self._mc.update_one({'system': system_id, 'path': file_path}, {'$set': body})
                resp = JsonResponse({
                    'success': 'Metadata has been updated',
                    'path': file_path,
                    'body': body
                })
            except:
                logger.exception('Error: failed to update meta document for: {p}'.format(p=file_path))
                resp = JsonResponse({
                    'error': 'Failed to update meta document',
                    'path': file_path
                })
        else:
            try:
                self._mc.insert_one(body)
                body['_id'] = str(body['_id'])
                resp = JsonResponse({
                    'success': 'Metadata has been created',
                    'path': file_path,
                    'body': body
                })
            except:
                logger.exception('Error: failed to create meta document for: {p}'.format(p=file_path))
                resp = JsonResponse({
                    'error': 'Failed to create meta document',
                    'path': file_path
                })
        return resp


    # def move():
    #     return 'move'


    # def copy():
    #     return 'copy'


    # def update():
    #     return 'update'


    def delete_file_doc(self, system_id, file_path):
        """
        Delete all file metadata documents
        """
        try:
            self._mc.delete_many({'system': system_id, 'path': file_path})
            resp = JsonResponse({
                'success': 'Metadata has been deleted',
                'path': file_path
            })
        except:
            logger.exception('Error: failed to delete meta document for: {p}'.format(p=file_path))
            resp = JsonResponse({
                'error': 'Failed to delete meta document',
                'path': file_path
            })
        return resp
