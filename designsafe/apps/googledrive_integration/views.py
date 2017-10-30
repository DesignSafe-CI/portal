import google_auth_oauthlib.flow
import google.oauth2.credentials
import requests
import os
from googleapiclient import discovery

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.http import (HttpResponse, HttpResponseRedirect, HttpResponseBadRequest,
                         Http404)
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View
from django.shortcuts import render
from designsafe.apps.googledrive_integration.models import GoogleDriveUserToken
from designsafe.apps.googledrive_integration.tasks import check_connection


CLIENT_SECRETS_FILE = os.path.join(settings.SITE_DIR, 'client_secrets.json')
import logging
logger = logging.getLogger(__name__)

@login_required
def index(request):
    context = {}
    try:
        GoogleDriveUserToken.objects.get(user=request.user)
        context['googledrive_enabled'] = True
        try:
            googledrive_user = check_connection(request.user.username)
            context['googledrive_connection'] = googledrive_user
        except Exception as e:
            # authentication failed
            logger.exception('google drive failed to authenticate: {}'.format(e))
            logger.warning('Google Drive oauth token for user=%s failed to authenticate' %
                           request.user.username)
            context['googledrive_connection'] = False

    except:
        logger.debug('GoogleDriveUserToken does not exist for user=%s' % request.user.username)

    return render(request, 'designsafe/apps/googledrive_integration/index.html', context)


@csrf_exempt
@login_required
def initialize_token(request):
    redirect_uri = reverse('googledrive_integration:oauth2_callback')
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=['https://www.googleapis.com/auth/drive'])
    flow.redirect_uri = request.build_absolute_uri(redirect_uri)

    logger.debug(request.build_absolute_uri(redirect_uri))

    auth_url, state = flow.authorization_url(access_type='offline')

    request.session['googledrive'] = {
        'state': state
    }

    return HttpResponseRedirect(auth_url)


@csrf_exempt
@login_required
def oauth2_callback(request):
    state = request.GET.get('state')
    if 'googledrive' in request.session:
        googledrive = request.session['googledrive']
    else:
        return HttpResponseBadRequest('Unexpected request')

    if not (state == googledrive['state']):
        return HttpResponseBadRequest('Request expired')

    try:
        redirect_uri = reverse('googledrive_integration:oauth2_callback')
        flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=['https://www.googleapis.com/auth/drive'],
            state=state)
        flow.redirect_uri = request.build_absolute_uri(redirect_uri)

        # Use the authorization server's response to fetch the OAuth 2.0 tokens.
        authorization_response = request.build_absolute_uri()
        logger.debug(authorization_response)
        flow.fetch_token(authorization_response=authorization_response)
            
        credentials = flow.credentials
        logger.debug('CREDENTIAL SCOPES: {}'.format(credentials.scopes))
        logger.debug('CREDENTIALS: {}'.format(credentials))
        token = GoogleDriveUserToken(
            user=request.user,
            token=credentials.token,
            refresh_token=credentials.refresh_token,
            token_uri=credentials.token_uri,
            scopes=credentials.scopes[0]
        )
        
        token.save()

    # except BadStateException as e:
    #     # Start the auth flow again.
    #     HttpResponseRedirect(reverse('googledrive_integration:initialize_token'))
    except Exception as e:
        logger.exception('Unable to complete Google Drive integration setup: %s' % e)
        messages.error(request, 'Oh no! An unexpected error occurred while trying to set '
                                'up the Google Drive application. Please try again.')

    return HttpResponseRedirect(reverse('googledrive_integration:index'))


@login_required
def disconnect(request):
    if request.method == 'POST':
        logger.info('Disconnect Google Drive requested by user...')
        try:
            googledrive_user_token = GoogleDriveUserToken.objects.get(user=request.user)
            credentials = google.oauth2.credentials.Credentials({
                'token': googledrive_user_token.token,
                'refresh_token': googledrive_user_token.refresh_token,
                'token_uri': googledrive_user_token.token_uri,
                'client_id': settings.GOOGLE_APP_CLIENT_ID,
                'client_secret': settings.GOOGLE_APP_SECRET,
                'scopes': [googledrive_user_token.scopes]
            })
            revoke = requests.post('https://accounts.google.com/o/oauth2/revoke',
                params={'token': credentials.token},
                headers = {'content-type': 'application/x-www-form-urlencoded'})
            
            status_code = getattr(revoke, 'status_code')

            googledrive_user_token = request.user.googledrive_user_token
            googledrive_user_token.delete()

            if status_code == 200:
                return render(request, 'designsafe/apps/googledrive_integration/disconnect.html')

            else:
                logger.error('Disconnect Google Drive; GoogleDriveUserToken delete error.',
                         extra={'user': request.user})
                messages.success(request,'Your Google Drive account has been disconnected from DesignSafe.')

                return HttpResponseRedirect(reverse('googledrive_integration:index'))

        # except DropboxUserToken.DoesNotExist:
        #     logger.warn('Disconnect Dropbox; DropboxUserToken does not exist.',
        #                 extra={'user': request.user})
        except Exception as e:
            logger.error('Disconnect Google Drive; GoogleDriveUserToken delete error.',
                         extra={'user': request.user})
            logger.exception('google drive delete error: {}'.format(e))
        messages.success(
            request,
            'Your Google Drive account has been disconnected from DesignSafe.')

        return HttpResponseRedirect(reverse('googledrive_integration:index'))

    return render(request, 'designsafe/apps/googledrive_integration/disconnect.html')
