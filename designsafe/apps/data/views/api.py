from django.conf import settings
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
#from dsapi.agave.files import *
from agavepy.agave import Agave
from designsafe.apps.data.apps import DataEvent
import json
import logging

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

    return HttpResponse(json.dumps(l), content_type="application/json")

@login_required
@require_http_methods(['GET'])
def download(request, file_path = '/'):
    """
    Returns bytes of a specific file
    @file_path: String, file path to download
    """
    pass
    #TODO: should use @is_ajax
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
