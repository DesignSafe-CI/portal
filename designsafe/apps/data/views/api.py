from django.conf import settings
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
#from dsapi.agave.files import *
from agavepy.agave import Agave
from designsafe.apps.data.apps import DataEvent
import json
import logging
import requests

logger = logging.getLogger(__name__)

@login_required
@require_http_methods(['GET'])
def listings(request, file_path = '/'):
    """
    Returns a list of files/diretories under a specific path.
    @file_path: String, path to list.
    returns: array of file objects.
    """
    #TODO: should use @is_ajax.
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    logger.info('token: {0}'.format(access_token))
    url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')

    a = Agave(api_server = url, token = access_token)
    l = a.files.list(systemId = filesystem,
                     filePath = request.user.username + '/' + file_path)

    for f in l:
        f['lastModified'] = f['lastModified'].strftime('%Y-%m-%d %H:%M:%S')
    logger.info('Listing: {0}'.format(json.dumps(l, indent=4)))
    DataEvent.send_event(event_data = {'path': file_path, 'callback': 'getList'})

    return HttpResponse(json.dumps(l), content_type="application/json", status=200)

@login_required
@require_http_methods(['GET'])
def download(request, file_path = '/'):
    """
    Returns bytes of a specific file
    @file_path: String, file path to download
    """
    #TODO: should use @is_ajax
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')

    a = Agave(api_server = url, token = access_token)
    logger.info('file_path: ' + file_path)
    f = a.files.list(systemId = filesystem,
                     filePath = request.user.username + '/' + file_path)

    download_url = f[0]['_links']['self']['href']
    content_type = f[0]['mimeType']

    resp = requests.get(download_url, stream=True,
        headers={'Authorization':'Bearer %s' % access_token})

    return StreamingHttpResponse(resp.content, content_type=content_type, status=200)

@login_required
@require_http_methods(['GET', 'POST'])
def metadata(request, file_path = '/'):
    """
    Gets/sets metadata to a specific file/folder.
    @file_path: String
    """
    #TODO: Should use @is_ajax
    #TODO: POST verb, too?
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
    a = Agave(api_server = url, token = access_token)

    f = a.files.list(systemId = filesystem,
                filePath = request.user.username + '/' + file_path)

    f = f[0]
    meta_dict = f['_links'].get('metadata', None)
    meta_link = meta_dict['href']

    if meta_link is None:
        return HttpResponse('{"status": 404, "message": "Not Found"}', content_type="application/json", status = 404)

    meta_q = meta_link.split('?q=')[1]

    #Let's just get the metadata.
    if request.method == 'GET':
        logger.info('Looking for metadata with the query: {0}'.format(meta_q))

        meta = a.meta.listMetadata(q=meta_q)
        logger.info('Metadata: {0}'.format(meta))

        return HttpResponse(json.dumps(meta), content_type='application/json', status=200)

    else:
        #The verb is POST so we need to add/update metadata
        body = json.loads(request.body)
        meta = body.get('metadata', None)
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
            r = a.meta.addMetadata(body = meta)
        else:
            r = a.meta.updateMetadata(uuid = meta['uuid'], body = meta)

        return HttpResponse('{"status": 200, "message": "OK"}', content_type="application/json")
