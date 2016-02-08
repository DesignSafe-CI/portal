from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import render
import logging
import os
import requests
import time


logger = logging.getLogger(__name__)


def login_options(request):
    if request.user.is_authenticated():
        messages.info(request, 'You are already logged in!')
        return HttpResponseRedirect('/')
    return render(request, 'designsafe/apps/auth/login.html')


def agave_oauth(request):
    tenant_base_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    client_key = getattr(settings, 'AGAVE_CLIENT_KEY')

    session = request.session
    session['auth_state'] = os.urandom(24).encode('hex')
    next_page = request.GET.get('next')
    if next_page:
        session['next'] = next_page

    redirect_uri = reverse('designsafe_auth:agave_oauth_callback')
    authorization_url = (
        '%s/authorize?client_id=%s&response_type=code&redirect_uri=%s&state=%s' % (
            tenant_base_url,
            client_key,
            request.build_absolute_uri(redirect_uri),
            session['auth_state'],
        )
    )
    return HttpResponseRedirect(authorization_url)


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
        tenant_base_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
        client_key = getattr(settings, 'AGAVE_CLIENT_KEY')
        client_sec = getattr(settings, 'AGAVE_CLIENT_SECRET')
        redirect_uri = request.build_absolute_uri(
            reverse('designsafe_auth:agave_oauth_callback'))
        body = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
        }
        response = requests.post('%s/token' % tenant_base_url,
                                 data=body,
                                 auth=(client_key, client_sec))
        token = response.json()
        token['created'] = int(time.time())
        request.session[getattr(settings, 'AGAVE_TOKEN_SESSION_ID')] = token

        # log user in
        user = authenticate(backend='agave', token=token['access_token'])
        if user:
            login(request, user)
            messages.success(request, 'Login successful. Welcome back, %s %s!' %
                (user.first_name, user.last_name))
        else:
            messages.error(
                request,
                'Authentication failed. Please try again. If this problem '
                'persists please submit a support ticket.'
            )
            return HttpResponseRedirect(reverse('designsafe_auth:login'))
    else:
        if 'error' in request.GET:
            error = request.GET['error']
            logger.error('Authorization failed: %s' % error)

        messages.error(request, 'Authentication failed')
        return HttpResponseRedirect(reverse('designsafe_auth:login'))

    if 'next' in request.session:
        next_uri = request.session.pop('next')
        return HttpResponseRedirect(next_uri)
    else:
        return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
