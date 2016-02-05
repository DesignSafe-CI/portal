from django.conf import settings
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
#from dsapi.agave.files import *
from agavepy.agave import Agave, AgaveException
from designsafe.apps.data.apps import DataEvent

from .base import BaseView
from dsapi.agave.daos import AgaveFolderFile, AgaveMetaFolderFile, AgaveFilesManager

import json
import logging
import requests
import traceback


logger = logging.getLogger(__name__)

class ListingsView(BaseView):
    
    def set_context_props(self, request, **kwargs):
        super(ListingsView, self).set_context_props(request, **kwargs)

    def get(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        manager = AgaveFilesManager(self.agave_client)
        l = manager.list_path(system_id = self.filesystem, path = self.file_path)
        return self.render_to_json_response([o.as_json() for o in l])

class DownloadView(BaseView):

    def set_context_props(self, request, **kwargs):
        super(DownloadView, self).set_context_props(request, **kwargs)

    def get(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        f = AgaveFolderFile.frompath(agave_client = self.agave_client,
                system_id = self.filesystem, 
                path = self.file_path,
                username = request.user.username)
        ds = self.download_stream(headers = {'Authorization': 'Bearer %s' % self.access_token})
        return StreamingHttpResponse(ds.content, content_type=f.mimetype, status=200)

class UploadView(BaseView):
    def post(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        f = AgaveMetaFolderFile.from_file(agave_client = self.agave_client,
                f = request.FILES['file'],
                system_id = self.filesystem,
                path = self.file_path,
                username = request.user.username)
        f.upload_file(f, 
                      headers = {'Authorization': 'Bearer %s' % self.access_token})
        return self.render_to_json_response({'message': 'OK'})

def get_metadata(request, file_path, **kwargs):
    a = kwargs.get('a')
    meta_q = kwargs.get('meta_q')
    logger.info('Looking for metadata with the query: {0}'.format(meta_q))
    logger.info('file path:{0}'.format(file_path))
    meta = a.meta.listMetadata(q=meta_q)
    logger.info('Metadata: {0}'.format(meta))

    return HttpResponse(json.dumps(meta), content_type='application/json', status=200)

def post_metadata(request, file_path, **kwargs):
    #The verb is POST so we need to add/update metadata
    a = kwargs.get('a')
    body = json.loads(request.body)
    meta = body.get('metadata', None)
    meta_q = kwargs.get('meta_q')
    logger.info('Metadata received: {0}'.format(request.body))
    if meta is None or 'value' not in meta:
        return HttpResponse('{"status": 500, "message": "No metadata sent."}', content_type="application/json", status = 500)

    if 'uuid' not in meta:
        meta_uuid = meta_q.split(':')[1]
        meta_uuid = meta_uuid.replace('"', '').replace('}', '')
        logger.info('Meta UUID: {0}'.format(meta_uuid))
        meta = {
            'name': 'designsafe metadata',
            'associationIds': [meta_uuid],
            'value': meta['value']
        }
        try:
            r = a.meta.addMetadata(body = meta)
        except KeyError as e:
            if e.message == 'date-time':
                logger.error('Error on agavepy looking for key "date-time".')
            else:
                raise
    else:
        try:
            r = a.meta.updateMetadata(uuid = meta['uuid'], body = meta)
        except KeyError as e:
            if e.message == 'date-time':
                logger.error('Error on agavepy looking for key "date-time".')
            else:
                raise
    logger.info('Metadata sent: {0}'.format(meta))
    return HttpResponse('{"status": 200, "message": "OK"}', content_type="application/json")

@login_required
@require_http_methods(['GET', 'POST'])
def metadata(request, file_path = '/'):
    """
    Gets/sets metadata to a specific file/folder.
    @file_path: String
    """
    #TODO: Should use @is_ajax
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
    try:
        a = Agave(api_server = url, token = access_token)

        f = a.files.list(systemId = filesystem,
                    filePath = request.user.username + '/' + file_path)

        f = f[0]
        meta_dict = f['_links'].get('metadata', None)
        meta_link = meta_dict['href']

        if meta_link is None:
            return HttpResponse('{"status": 404, "message": "Not Found"}', content_type="application/json", status = 404)

        meta_q = meta_link.split('?q=')[1]
        handler = globals()['%s_metadata' % request.method.lower()]

        return handler(request, file_path, a = a, filesystem = filesystem, meta_q = meta_q)

    except AgaveException as e:
        logger.error('Agave Exception: {0}'.format(e))
        logger.error(traceback.format_exc())
        return HttpResponse('{{"error": "{0}" }}'.format(json.dumps(e.message)),
            status = 500, content_type='application/json')
    except Exception as e:
        logger.error('Exception: {0}'.format(e.message))
        logger.error(traceback.format_exc())
        return HttpResponse('{{"error": "{0}" }}'.format(json.dumps(e.message)),
            status = 500, content_type='application/json')

           
@login_required
@require_http_methods(['GET'])
def meta_search(request):
    """
    Search metadata
    """
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
    try:
        a = Agave(api_server = url, token = access_token)

        #TODO: Make it more intelligent by looking in the metadata schemas.
        #TODO: Probably should have a libr to create MongoDB-like queries from q string and schema.
        #TODO: Querying Agave metadata does not return file Permissions or file type. We could handle this in the frontend by caching this information. Too big?, or just add it to our metadata Schema.
        #TODO: How is this going to change once we have the Data Backend in place?
        #TODO: Agave just knows if it's a folder or something else, discuss...

        meta_qs = json.loads(request.GET.get('q'))
        logger.info('Meta_qs: {0}'.format(meta_qs))
        if 'all' in meta_qs:
            meta_q = {
                '$or': [
                    {'value.project': {'$regex': meta_qs['all'], '$options':'i'}},
                    {'value.author': {'$regex': meta_qs['all'], '$options':'i'}},
                    {'value.source': {'$regex': meta_qs['all'], '$options':'i'}},
                    {'value.key': {'$regex': meta_qs['all'], '$options':'i'}}
                ]
            }
        else:
            meta_q = {'$or': []}
            for key, value in meta_qs.items():
                meta_q['$or'].append({'value.%s' % key: {'$regex': value, '$options':'i'}})

        logger.info('Searching for metadata with the query: {0}'.format(json.dumps(meta_q)))

        matches = a.meta.listMetadata(q=json.dumps(meta_q))
        res = []
        fs = ''
        fsi = 0
        f = {}
        for match in matches:
            fs = match['_links']['file']['href']
            fsi = fs.find(filesystem)
            f = a.files.list(systemId = filesystem, filePath = fs[ fsi + len(filesystem) + 1:])
            f = f[0]
            f['lastModified'] = f['lastModified'].strftime('%Y-%m-%d %H:%M:%S')
            f['agavePath'] = 'agave://{0}/{1}'.format(f['system'], f['path'])
            if f['name'] == '.':
                f['name'] = fs.split('/')[-1]
            res.append(f)
        logger.info('Metadata results for query {0}: {1}'.format(meta_q, res))

    except AgaveException as e:
        logger.error('Agave Exception: {0}'.format(e))
        logger.error(traceback.format_exc())
        return HttpResponse('{{"error": "{0}" }}'.format(json.dumps(e.message)),
            status = 500, content_type='application/json')
    except Exception as e:
        logger.error('Exception: {0}'.format(e.message))
        logger.error(traceback.format_exc())
        return HttpResponse('{{"error": "{0}" }}'.format(json.dumps(e.message)),
            status = 500, content_type='application/json')

    return HttpResponse('{{"status": 200, "message": "OK", "result": {0} }}'.format(json.dumps(res)), content_type='application/json', status=200)
