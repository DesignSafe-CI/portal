from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import render

import json
import logging
import os
import requests
import time


logger = logging.getLogger(__name__)

def agave_oauth(request):
    tenantBaseUrl = getattr(settings, 'AGAVE_TENANT_BASEURL')
    clientKey = getattr(settings, 'AGAVE_CLIENT_KEY')

    session = request.session
    session['auth_state'] = os.urandom(24).encode('hex')
    session.save()

    authorizationUrl = ('%s/authorize?client_id=%s&response_type=code'
            '&redirect_uri=%s&state=%s' % (
            tenantBaseUrl,
            clientKey,
            request.build_absolute_uri(reverse('designsafe_auth:agave_oauth_callback')),
            session['auth_state'],
            ))
    return HttpResponseRedirect(authorizationUrl)

def agave_oauth_callback(request):
    state = request.GET.get('state')

    if request.session['auth_state'] != state:
        msg = ('OAuth Authorization State mismatch!? auth_state=%s '
            'does not match returned state=%s' % (request.session['auth_state'], state))
        logger.error(msg)
        return HttpResponseBadRequest('Authorization State Failed')

    if 'code' in request.GET:
        # obtain a token for the user
        code = request.GET['code']
        tenantBaseUrl = getattr(settings, 'AGAVE_TENANT_BASEURL')
        clientKey = getattr(settings, 'AGAVE_CLIENT_KEY')
        clientSec = getattr(settings, 'AGAVE_CLIENT_SECRET')
        redirect_uri = request.build_absolute_uri(
            reverse('designsafe_auth:agave_oauth_callback'))
        body = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
        }
        response = requests.post('%s/token' % tenantBaseUrl, data=body, auth=(clientKey, clientSec))
        token = response.json()
        token['created'] = int(time.time())
        request.session['agave_token'] = token

        # log user in
        user = authenticate(backend='agave', token=token['access_token'])
        if user:
            login(request, user)
    else:
        if 'error' in request.GET:
            error = request.GET['error']
            logger.error('Authorization failed: %s' % error)

        messages.error(request, 'Authentication failed')

    return HttpResponseRedirect('/')