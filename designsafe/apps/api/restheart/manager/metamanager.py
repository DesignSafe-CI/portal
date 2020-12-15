import logging
import json
import requests
from tapipy.tapis import Tapis
from django.conf import settings
from django.http import JsonResponse
from django.http import HttpResponseBadRequest, HttpResponseForbidden
from requests import HTTPError

logger = logging.getLogger(__name__)

class FileMetaManager():
    """
    Manger for TAPIS V3 File Metadata

    """

    def __init__(self):
        self.tapis = Tapis(base_url=settings.TAPIS_TENANT_BASEURL,
                           tenant_id=settings.TAPIS_TENANT_ID,
                           username=settings.TAPIS_TENANT_USER,
                           account_type='user',
                           password=settings.TAPIS_TENANT_PASS)
        self.database = 'designsafedb'
        self.collection = 'files'
        self.tapis.get_tokens()

    def get_all_test(self):
        # first few files in the collection
        """
        BOOKMARK: created a 'files' collection
        - we need to get the pySDK kit installed so we can manage v3 services.
        """
        collections = self.tapis.meta.listDocuments(db=self.database, collection=self.collection)
        documents = json.loads(collections.decode("utf-8"))
        return documents

    def get_doc_test(self):
        # request a single file by OID... or file path... but we'll need the user's info in the path. How will we get and retrieve files?
        # what data will we save with each file?
        #
        headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer {}'.format(settings.RESTHEART_CLIENT_TOKEN)
        }
        doc_path = self._db_url + '5f6bb3065bfeafbfcf063686'
        response = requests.request("GET", doc_path, headers=headers)
        return response.json()

    def get_file_doc(self, system_id, file_path):
        """
        Get file's metadata document
        """
        logger.info("~~~~ PARAMS ~~~~")
        logger.info(system_id)
        logger.info(file_path)

        query = { 'system': { '$eq': system_id }, 'path': { '$eq': file_path } }
        resp = self.tapis.meta.listDocuments(db='designsafedb', collection='files', filter=str(query))
        document = resp.decode("utf-8")
        return document

        # file_meta = self._mc.find_one({'system': system_id, 'path': file_path})
        # if file_meta:
        #     file_meta['_id'] = str(file_meta['_id'])
        #     return file_meta
        # else:
        #     return file_meta


    def list_file_docs(self, system_id, file_path):
        """
        Get file metadata documents for all files in a given system and file path
        """
        return 'file_metas'


    def create_file_doc(self, body, system_id, file_path):
        """
        Create/Update a file metadata document

        """
        logger.info("PARAMS")
        logger.info(system_id)
        logger.info(file_path)

        body = json.loads(body.decode("utf-8"))
        self.tapis.meta.createDocument(db='designsafedb',
                                       collection='files',
                                       request_body=body)
        return body

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
