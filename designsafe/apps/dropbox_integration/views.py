from dropbox.oauth import DropboxOAuth2Flow, BadRequestException, BadStateException, CsrfException, NotApprovedException, ProviderException
from dropbox.dropbox import Dropbox

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
from designsafe.apps.dropbox_integration.models import DropboxUserToken

import logging
import json


logger = logging.getLogger(__name__)

@login_required
def index(request):
    context = {}
    try:
        dropbox_token = DropboxUserToken.objects.get(user=request.user)
        context['dropbox_enabled'] = True
        try:
            dropbox = Dropbox(dropbox_token.access_token)
            dropbox_user=dropbox.users_get_account(dropbox_token.account_id)
            context['dropbox_connection'] = dropbox_user
        except BadRequestException:
            # authentication failed
            logger.warning('Dropbox oauth token for user=%s failed to authenticate' %
                           request.user.username)
            context['dropbox_connection'] = False

    except DropboxUserToken.DoesNotExist:
        logger.debug('DropboxUserToken does not exist for user=%s' % request.user.username)

    return render(request, 'designsafe/apps/dropbox_integration/index.html', context)


# @login_required
def get_dropbox_auth_flow(request):
    redirect_uri = reverse('dropbox_integration:oauth2_callback')
    return DropboxOAuth2Flow(
        consumer_key = settings.DROPBOX_APP_KEY,
        consumer_secret = settings.DROPBOX_APP_SECRET,
        redirect_uri = request.build_absolute_uri(redirect_uri),
        session = request.session['dropbox'],
        csrf_token_session_key = 'state'
    )

@csrf_exempt
@login_required
def initialize_token(request):
    request.session['dropbox']={}
    logger.info('request.session["dropbox"]: {}'.format(request.session['dropbox']))
    auth_url = get_dropbox_auth_flow(request).start()
    logger.info('request.session["dropbox"]: {}'.format(request.session['dropbox']))
    return HttpResponseRedirect(auth_url)


@csrf_exempt
@login_required
def oauth2_callback(request):
    try:
        oauth = get_dropbox_auth_flow(request).finish(request.GET)
        token = DropboxUserToken(
            user=request.user,
            access_token=oauth.access_token,
            account_id=oauth.account_id,
            dropbox_user_id=oauth.user_id,
        )
        token.save()

    except BadStateException as e:
        # Start the auth flow again.
        HttpResponseRedirect(reverse('dropbox_integration:initialize_token'))
    except Exception as e:
        logger.exception('Unable to complete Dropbox integration setup: %s' % e)
        messages.error(request, 'Oh no! An unexpected error occurred while trying to set '
                                'up the Dropbox.com application. Please try again.')

    return HttpResponseRedirect(reverse('dropbox_integration:index'))


@login_required
def disconnect(request):
    if request.method == 'POST':
        logger.info('Disconnect Dropbox.com requested by user...')
        try:
            dropbox_token = DropboxUserToken.objects.get(user=request.user)
            dropbox = Dropbox(dropbox_token.access_token)
            dropbox.auth_token_revoke()

            dropbox_user_token = request.user.dropbox_user_token
            dropbox_user_token.delete()

        except DropboxUserToken.DoesNotExist:
            logger.warn('Disconnect Dropbox; DropboxUserToken does not exist.',
                        extra={'user': request.user})
        except:
            logger.error('Disconnect Dropbox; DropboxUserToken delete error.',
                         extra={'user': request.user})
        messages.success(
            request,
            'Your Dropbox.com account has been disconnected from DesignSafe.')

        return HttpResponseRedirect(reverse('dropbox_integration:index'))

    return render(request, 'designsafe/apps/dropbox_integration/disconnect.html')
