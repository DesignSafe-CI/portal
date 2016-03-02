from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import render
from .models import AgaveOAuthToken, AgaveServiceStatus
import logging
import os
import requests
import time


logger = logging.getLogger(__name__)


def logged_out(request):
    return render(request, 'designsafe/apps/auth/logged_out.html')


def login_options(request):
    if request.user.is_authenticated():
        messages.info(request, 'You are already logged in!')
        return HttpResponseRedirect('/')

    agave_status = AgaveServiceStatus()
    ds_oauth_svc_id = getattr(settings, 'AGAVE_DESIGNSAFE_OAUTH_STATUS_ID',
                              '56bb6d92a216b873280008fd')
    designsafe_status = (s for s in agave_status.status
                         if s['id'] == ds_oauth_svc_id).next()
    if designsafe_status['status_code'] == 400:
        message = {
            'class': 'warning',
            'text': 'DesignSafe API Services are experiencing a Partial Service '
                    'Disruption. Some services may be unavailable.'
        }
    elif designsafe_status['status_code'] == 500:
        message = {
            'class': 'danger',
            'text': 'DesignSafe API Services are experiencing a Service Disruption. '
                    'Some services may be unavailable.'
        }
    else:
        message = False

    context = {
        'message': message,
        'agave_status': agave_status,
        'designsafe_status': designsafe_status,
    }
    return render(request, 'designsafe/apps/auth/login.html', context)


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
        token_data = response.json()
        token_data['created'] = int(time.time())
        # log user in
        user = authenticate(backend='agave', token=token_data['access_token'])
        if user:
            try:
                token = user.agave_oauth
                token.update(**token_data)
            except ObjectDoesNotExist:
                token = AgaveOAuthToken(**token_data)
                token.user = user
            token.save()
            request.session[getattr(settings, 'AGAVE_TOKEN_SESSION_ID')] = token.token
            login(request, user)
            if user.last_login is not None:
                msg_tmpl = 'Login successful. Welcome back, %s %s!'
            else:
                msg_tmpl = 'Login successful. Welcome to DesignSafe-CI, %s %s!'
            messages.success(request, msg_tmpl % (user.first_name, user.last_name))
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

        messages.error(
            request, 'Authentication failed! Did you forget your password? '
                     '<a href="%s">Click here</a> to reset your password.' %
                     reverse('designsafe_accounts:password_reset'))
        return HttpResponseRedirect(reverse('designsafe_auth:login'))

    if 'next' in request.session:
        next_uri = request.session.pop('next')
        return HttpResponseRedirect(next_uri)
    else:
        return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)


def agave_session_error(request):
    return render(request, 'designsafe/apps/auth/agave_session_error.html')
