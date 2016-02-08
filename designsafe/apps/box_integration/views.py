from boxsdk import OAuth2, Client
from boxsdk.exception import BoxOAuthException, BoxException
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import render
from .models import BoxUserToken
from .tasks import check_connection, check_or_create_sync_folder
import logging


logger = logging.getLogger(__name__)


@login_required
def index(request):
    context = {}
    try:
        BoxUserToken.objects.get(user=request.user)
        context['box_enabled'] = True
        try:
            box_user = check_connection(request.user.username)
            context['box_connection'] = box_user
        except BoxOAuthException:
            # authentication failed
            logger.exception('Box oauth token for user=%s failed to authenticate' % request.user.username)
            context['box_connection'] = False
        except BoxException:
            # session layer exception
            logger.exception('Box API error when testing oauth token for user=%s' % request.user.username)
            context['box_connection'] = False

    except BoxUserToken.DoesNotExist:
        logger.debug('BoxUserToken does not exist for user=%s' % request.user.username)

    return render(request, 'designsafe/apps/box_integration/index.html', context)


@login_required
def initialize_token(request):
    oauth = OAuth2(
        client_id=settings.BOX_APP_CLIENT_ID,
        client_secret=settings.BOX_APP_CLIENT_SECRET
    )
    redirect_uri = reverse('box_integration:oauth2_callback')
    logger.debug(request.build_absolute_uri(redirect_uri))
    auth_url, state = oauth.get_authorization_url(request.build_absolute_uri(redirect_uri))
    request.session['box'] = {
        'state': state
    }
    return HttpResponseRedirect(auth_url)


@login_required
def oauth2_callback(request):
    auth_code = request.GET.get('code')
    state = request.GET.get('state')
    if 'box' in request.session:
        box = request.session['box']

    if not (box and auth_code and state):
        return HttpResponseBadRequest('Unexpected request')

    if not (state == box['state']):
        return HttpResponseBadRequest('Request expired')

    try:
        oauth = OAuth2(
            client_id=settings.BOX_APP_CLIENT_ID,
            client_secret=settings.BOX_APP_CLIENT_SECRET
        )
        access_token, refresh_token = oauth.authenticate(auth_code)
        client = Client(oauth)
        box_user = client.user(user_id='me').get()
        token = BoxUserToken(
            user=request.user,
            access_token=access_token,
            refresh_token=refresh_token,
            box_user_id=box_user.id,
        )
        token.save()
        check_or_create_sync_folder.delay(request.user.username)
    except BoxException as e:
        logger.exception('Unable to complete Box integration setup: %s' % e)
        messages.error(request, 'Oh no! An unexpected error occurred while trying to set '
                                'up the Box.com application. Please try again.')

    return HttpResponseRedirect(reverse('box_integration:index'))


@login_required
def disconnect(request):
    if request.method == 'POST':
        logger.info('Disconnect Box.com requested by user...')
        try:
            token = BoxUserToken.objects.get(user=request.user)
            token.delete()
            messages.success(request, 'Your Box.com account has been disconnected from DesignSafe-CI.')
            return HttpResponseRedirect(reverse('box_integration:index'))
        except:
            logger.exception('Disconnect Box.com failed')

    return render(request, 'designsafe/apps/box_integration/disconnect.html')
