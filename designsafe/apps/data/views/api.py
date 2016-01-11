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
import traceback


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
    #TODO: paginate resutls.
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    logger.info('token: {0}'.format(access_token))
    url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
    if file_path is None:
        path = request.user.username
    else:
        path = '%s/%s' % (request.user.username, file_path)
    a = Agave(api_server = url, token = access_token)
    l = a.files.list(systemId = filesystem, filePath = path)

    #TODO: We need a proper serializer for datetimes
    for f in l:
        f['lastModified'] = f['lastModified'].strftime('%Y-%m-%d %H:%M:%S')
        f['agavePath'] = 'agave://{0}/{1}'.format(f['system'], f['path'])

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
    logger.info('download file_path: ' + file_path)
    f = a.files.list(systemId = filesystem,
                     filePath = request.user.username + '/' + file_path)

    download_url = f[0]['_links']['self']['href']
    content_type = f[0]['mimeType']

    resp = requests.get(download_url, stream=True,
        headers={'Authorization':'Bearer %s' % access_token})
    #TODO: Create a file-like object to overwrtie read() to iterate through resp.iter_content, resp.content is probably loading the entire file in memory.
    return StreamingHttpResponse(resp.content, content_type=content_type, status=200)

@login_required
@require_http_methods(['POST'])
def upload(request, file_path = '/'):
    """
    Uploads a file to the specified filesystem
    @file_path: String, file path to upload
    """
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
    if file_path is None:
        file_path = '/'
    a = Agave(api_server = url, token = access_token)
    logger.info('upload file_path: ' + file_path)
    f = request.FILES['file']
    logger.info('File to upload: {0}'.format(request.FILES['file']))
    #TODO: get the URI from the resources.
    upload_uri = url + '/files/v2/media/system/' + filesystem + '/' + request.user.username + '/' + file_path

    data = {
        'fileToUpload': f,
        'filePath': request.user.username + file_path,
        'fileName': f.name.split('/')[-1]
    }
    try:
        #TODO: Loop if multiple files.
        #TODO: Loading progress bar, we'd need a custom file handler for that.
        #TODO: Create a custom file-like class to override 'read()' and return a chunk. Right now requests is probably using f.read() and that loads the entire file in memory. CHUNKS!
        resp = requests.post(upload_uri, files = data,
        headers={'Authorization':'Bearer %s' % access_token})
        #resp = a.files.importData(systemId = filesystem, fileToUpload = f, filePath = request.user.username + file_path, fileType=f.content_type)
        logger.info('Rsponse from upload: {0}'.format(resp.text))
    except:
        logger.error(traceback.format_exc())
        return HttpResponse('{"status": 500, "message": "Error uploading data."}', content_type="application/json", status = 500)

    return HttpResponse('{"status":200, "message": "Succesfully uploaded."}', content_type='application/json', status=200)

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
    a = Agave(api_server = url, token = access_token)

    #TODO: Make it more intelligent by looking in the metadata schemas.
    #TODO: Probably should have a libr to create MongoDB-like queries from q string and schema.
    #TODO: Querying Agave metadata does not return file Permissions or file type. We could handle this in the frontend by caching this information. Too big?
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

    return HttpResponse('{{"status": 200, "message": "OK", "result": {0} }}'.format(json.dumps(res)), content_type='application/json', status=200)
