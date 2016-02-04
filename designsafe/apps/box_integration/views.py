from boxsdk import OAuth2
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import render
from .models import BoxUserToken
from .tasks import check_connection
import logging


logger = logging.getLogger(__name__)


def test(request):
    from .tasks import check_or_create_sync_folder
    check_or_create_sync_folder(request.user)
    return HttpResponseRedirect(reverse('box_integration:index'))


@login_required
def index(request):
    context = {}
    try:
        BoxUserToken.objects.get(user=request.user)
        context['box_enabled'] = True
        box_user = check_connection(request.user)
        context['box_connection'] = box_user
    except BoxUserToken.DoesNotExist:
        pass
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

    oauth = OAuth2(
        client_id=settings.BOX_APP_CLIENT_ID,
        client_secret=settings.BOX_APP_CLIENT_SECRET
    )
    access_token, refresh_token = oauth.authenticate(auth_code)
    token = BoxUserToken(
        user=request.user,
        access_token=access_token,
        refresh_token=refresh_token
    )
    token.save()

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
