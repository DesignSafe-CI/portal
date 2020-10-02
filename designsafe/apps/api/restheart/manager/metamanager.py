import logging
import json
import requests
# from designsafe.apps.api.restheart.utils import mongo_client
# replace mongo_client with agavepy client
from django.conf import settings
from django.http import JsonResponse
from django.http import HttpResponseBadRequest, HttpResponseForbidden
from requests import HTTPError

logger = logging.getLogger(__name__)


class FileMetaManager():

    def __init__(self):
        """
        Manger for V3 Meta Files
        collection: 'files'

        Testing curl commands for now. Set up use with "tapispy"
        """        
        self._db_url = "{host}{base}/{database}/{collection}".format(
            host=settings.RESTHEART_CLIENT_HOST,
            base=settings.RESTHEART_CLIENT_BASEURL,
            database=settings.RESTHEART_CLIENT_DS_DATABASE,
            collection=settings.RESTHEART_FILES_COLLECTION 
        )

    def get_all_test(self):
        # first few files in the collection
        """
        BOOKMARK: created a 'files' collection
        - we need to get the pySDK kit installed so we can manage v3 services.
        """
        headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer {}'.format(settings.RESTHEART_CLIENT_TOKEN)
        }
        response = requests.request("GET", self._db_url, headers=headers)
        return response.json()

    def get_doc_test(self):
        # request a single file by OID... or file path... but we'll need the user's info in the path. How will we get and retrieve files?
        # what data will we save with each file?
        # maybe check agave meta v2 and see...
        headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer {}'.format(settings.RESTHEART_CLIENT_TOKEN)
        }
        doc_path = self._db_url + '5f6bb3065bfeafbfcf063686'
        response = requests.request("GET", doc_path, headers=headers)
        return response.json()

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
