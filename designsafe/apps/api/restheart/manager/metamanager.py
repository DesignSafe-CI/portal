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
    Using designsafe admin account for calls.
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

    # def get_all_test(self):
    #     # first few files in the collection
    #     """
    #     resp = self.tapis.meta.listDocuments(db=self.database, collection=self.collection)
    #     documents = json.loads(resp.decode("utf-8"))
    #     return documents

    def get_file_doc(self, system_id, file_path):
        """
        Get file's metadata document
        This will return a document matching an exact system and file path.
        Note: can use regex too { '$regex': '/keiths' }
        """
        query = { 'system': { '$eq': system_id }, 'path': { '$eq': file_path } }
        resp = self.tapis.meta.listDocuments(db='designsafedb', collection='files', filter=str(query))
        document = json.loads(resp.decode("utf-8"))
        if len(document) == 1:
            return document[0]
        else:
            return document

    def create_file_doc(self, body, system_id, file_path):
        """
        Create file metadata document
        This will automatically update if an "_id" exists in the body
        that matches an "_id" in the database
        """
        body = json.loads(body.decode("utf-8"))
        self.tapis.meta.createDocument(db='designsafedb',
                                       collection='files',
                                       request_body=body)
        return body

    def delete_file_doc(self, doc_id):
        """
        Delete file metadata document
        """
        try:
            self.tapis.meta.deleteDocument(db='designsafedb',
                                           collection='files',
                                           docId=doc_id)
            resp = JsonResponse({
                'success': 'Deleted meta document',
                'path': doc_id
            })
            return resp
        except:
            logger.exception('Error: failed to delete meta document for: {p}'.format(p=file_path))
            resp = JsonResponse({
                'error': 'Failed to delete meta document',
                'path': file_path
            })
        return resp

    # def move():
    #     return 'move'

    # def copy():
    #     return 'copy'

    # def update():
    #     return 'update'