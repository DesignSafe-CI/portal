from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import render
import secrets

from .models import TapisOAuthToken, AgaveServiceStatus
from agavepy.agave import Agave
from tapipy.tapis import Tapis
from designsafe.apps.auth.tasks import check_or_create_agave_home_dir, new_user_alert
import logging
import os
import requests
import time
from requests import HTTPError



logger = logging.getLogger(__name__)


def logged_out(request):
    return render(request, 'designsafe/apps/auth/logged_out.html')


def login_options(request):
    if request.user.is_authenticated:
        messages.info(request, 'You are already logged in!')
        return HttpResponseRedirect('/')

    message = False

    try:
        agave_status = AgaveServiceStatus()
        ds_oauth_svc_id = getattr(settings, 'AGAVE_DESIGNSAFE_OAUTH_STATUS_ID',
                                  '56bb6d92a216b873280008fd')
        designsafe_status = next((s for s in agave_status.status
                             if s['id'] == ds_oauth_svc_id))
        if designsafe_status and 'status_code' in designsafe_status:
            if designsafe_status['status_code'] == 400:
                message = {
                    'class': 'warning',
                    'text': 'DesignSafe API Services are experiencing a '
                            'Partial Service Disruption. Some services '
                            'may be unavailable.'
                }
            elif designsafe_status['status_code'] == 500:
                message = {
                    'class': 'danger',
                    'text': 'DesignSafe API Services are experiencing a '
                            'Service Disruption. Some services may be '
                            'unavailable.'
                }
    except Exception as e:
        logger.warn('Unable to check AgaveServiceStatus')
        logger.warn(e)
        agave_status = None
        designsafe_status = None

    if not message:
        return tapis_oauth(request)
    else:
        context = {
            'message': message,
            'agave_status': agave_status,
            'designsafe_status': designsafe_status,
        }
        return render(request, 'designsafe/apps/auth/login.html', context)


def tapis_oauth(request):
    session = request.session
    session['auth_state'] = secrets.token_hex(24)
    next_page = request.GET.get('next')
    if next_page:
        session['next'] = next_page

    if request.is_secure():
        protocol = 'https'
    else:
        protocol = 'http'
    redirect_uri = f"{protocol}://{request.get_host()}{reverse('designsafe_auth:oauth_callback')}"

    tenant_base_url = getattr(settings, 'TAPIS_TENANT_BASE_URL')
    client_id = getattr(settings, 'TAPIS_CLIENT_ID')

    # Authorization code request
    authorization_url = (
        f"{tenant_base_url}/v3/oauth2/authorize?"
        f"client_id={client_id}&"
        f"client_redirect_uri={redirect_uri}&"
        "response_type=code"
        f"state={session['auth_state']}"
    )

    return HttpResponseRedirect(authorization_url)


def tapis_oauth_callback(request):
    state = request.GET.get('state')

    if request.session['auth_state'] != state:
        msg = (
            'OAuth Authorization State mismatch!? auth_state=%s '
            'does not match returned state=%s' % (
                request.session['auth_state'], state
            )
        )
        logger.warning(msg)
        return HttpResponseBadRequest('Authorization State Failed')

    if 'code' in request.GET:
        # obtain a token for the user
        if request.is_secure():
            protocol = 'https'
        else:
            protocol = 'http'
        redirect_uri = f"{protocol}://{request.get_host()}{reverse('designsafe_auth:oauth_callback')}"
        code = request.GET['code']

        body = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
        }
        response = requests.post(f"{settings.TAPIS_TENANT_BASE_URL}/v3/oauth2/tokens", data=body, auth=(settings.TAPIS_CLIENT_ID, settings.TAPIS_CLIENT_KEY))
        response_json = response.json()
        token_data = {
            'created': int(time.time()),
            'access_token': response_json['result']['access_token']['access_token'],
            'refresh_token': response_json['result']['refresh_token']['refresh_token'],
            'expires_in': response_json['result']['access_token']['expires_in']
        }

        # log user in
        user = authenticate(backend='tapis', token=token_data['access_token'])

        if user:
            try:
                token = user.tapis_oauth
                token.update(**token_data)
            except ObjectDoesNotExist:
                token = TapisOAuthToken(**token_data)
                token.user = user
                new_user_alert.apply_async(args=(user.username,))
            token.save()

            login(request, user)

            # ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
            #            token=settings.AGAVE_SUPER_TOKEN)
            # try:
            #     ag.files.list(systemId=settings.AGAVE_STORAGE_SYSTEM,
            #                   filePath=user.username)
            # except HTTPError as e:
            #     if e.response.status_code == 404:
            #         check_or_create_agave_home_dir.apply_async(args=(user.username,),queue='files')

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
            logger.warning('Authorization failed: %s' % error)
        messages.error(
            request, 'Authentication failed! Did you forget your password? '
                     '<a href="%s">Click here</a> to reset your password.' %
                     reverse('designsafe_accounts:password_reset'))
        return HttpResponseRedirect(reverse('designsafe_auth:login'))
    if 'next' in request.session:
        next_uri = request.session.pop('next')
        return HttpResponseRedirect(next_uri)
    else:
        # return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
        return HttpResponseRedirect(reverse('designsafe_dashboard:index'))


def agave_session_error(request):
    return render(request, 'designsafe/apps/auth/agave_session_error.html')
