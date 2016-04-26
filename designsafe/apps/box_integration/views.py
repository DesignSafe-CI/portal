from boxsdk import OAuth2, Client
from boxsdk.exception import BoxOAuthException, BoxException
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.http import (HttpResponse, HttpResponseRedirect, HttpResponseBadRequest,
                         HttpResponseServerError)
from django.core.serializers.json import DjangoJSONEncoder
from django.views.generic import View
from django.shortcuts import render
from designsafe.apps.box_integration.models import BoxUserToken
from designsafe.apps.box_integration.tasks import check_connection
from designsafe.apps.box_integration.util import BoxObjectJsonSerializer
from agavepy.agave import Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from dsapi.agave.daos import FileManager
import logging
import json


logger = logging.getLogger(__name__)


class BoxAPIView(View):

    def __init__(self, **kwargs):
        self.box_api = None
        super(BoxAPIView, self).__init__(**kwargs)

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        box_user_token = request.user.box_user_token
        oauth = OAuth2(
            client_id=settings.BOX_APP_CLIENT_ID,
            client_secret=settings.BOX_APP_CLIENT_SECRET,
            access_token=box_user_token.access_token,
            refresh_token=box_user_token.refresh_token,
            store_tokens=box_user_token.update_tokens
        )
        self.box_api = Client(oauth)
        return super(BoxAPIView, self).dispatch(request, *args, **kwargs)


class BoxFilesView(BoxAPIView):

    def get(self, request, path=None):
        folder_id = 0

        if path is not None:
            path_c = path.split('/')
            for c in path_c:
                children = self.box_api.folder(folder_id).get_items(limit=100, offset=0)
                for child in children:
                    if child.type == 'folder':
                        if child.name == c:
                            folder_id = child.object_id
                            break

        folder = self.box_api.folder(folder_id).get()
        context = {
            'folder': json.dumps(folder, cls=BoxObjectJsonSerializer),
        }

        return render(request, 'designsafe/apps/box_integration/files.html', context)


class BoxFilesJsonView(BoxAPIView):

    @property
    def agave_client(self):
        agave_oauth = self.request.user.agave_oauth
        if agave_oauth.expired:
            agave_oauth.refresh()
        return Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                     token=agave_oauth.access_token)

    def get(self, request, item_type, item_id):
        op = getattr(self.box_api, item_type)
        item = op(item_id).get()

        if item_type == 'file':
            if request.GET.get('download'):
                download_url = item.get_shared_link_download_url()
                return HttpResponse(json.dumps({'download_url': download_url}),
                                    content_type='application/json')
            elif request.GET.get('embed'):
                embed_item = op(item_id).get(fields=['expiring_embed_link'])
                return HttpResponse(json.dumps(embed_item, cls=BoxObjectJsonSerializer),
                                    content_type='application/json')

        return HttpResponse(json.dumps(item, cls=BoxObjectJsonSerializer),
                            content_type='application/json')

    def post(self, request, item_type, item_id):
        op = getattr(self.box_api, item_type)
        item = op(item_id).get()

        fm = FileManager(self.agave_client)
        target_dir = '%s/%s' % (request.user.username, request.GET.get('dir', ''))

        if item_type == 'file':
            try:
                import_resp = self.agave_client.files.importData(
                    systemId=settings.AGAVE_STORAGE_SYSTEM,
                    filePath=target_dir,
                    fileName=item.name,
                    urlToIngest=item.get_shared_link_download_url())
                async_resp = AgaveAsyncResponse(self.agave_client, import_resp)
                async_status = async_resp.result(600)
                if async_status == 'FAILED':
                    logger.error('Box File Transfer failed: %s' % target_dir)
                    return HttpResponseServerError('Transfer from Box failed')
                else:
                    file_path = '%s/%s' % (target_dir, item.name)
                    logger.info(
                        'Indexing Box File Transfer %s' % file_path)
                    fm.index(settings.AGAVE_STORAGE_SYSTEM, file_path,
                             request.user.username)

                return HttpResponse(json.dumps(import_resp, cls=DjangoJSONEncoder),
                                    content_type='application/json')
            except (TimeoutError, Error):
                logger.error('AsyncResponse Error on Agave.files.importData from Box',
                             extra={'box_file': item})
                return HttpResponseServerError('Transfer from Box failed: timeout')

        else:  # item_type == 'folder'
            mf, f = fm.mkdir(path=target_dir, new=item.name,
                             system_id=settings.AGAVE_STORAGE_SYSTEM,
                             username=request.user.username)
            return HttpResponse(json.dumps(f.as_json()), content_type='application/json')


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
            logger.warning('Box oauth token for user=%s failed to authenticate' %
                           request.user.username)
            context['box_connection'] = False
        except BoxException:
            # session layer exception
            logger.warning('Box API error when testing oauth token for user=%s' %
                           request.user.username)
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
    else:
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

        # save the token
        box_user = client.user(user_id=u'me').get()
        token = BoxUserToken(
            user=request.user,
            access_token=access_token,
            refresh_token=refresh_token,
            box_user_id=box_user.id,
        )
        token.save()
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
            box_user_token = request.user.box_user_token
            box_user_token.delete()
        except BoxUserToken.DoesNotExist:
            logger.warn('Disconnect Box; BoxUserToken does not exist.',
                        extra={'user': request.user})
        except:
            logger.error('Disconnect Box; BoxUserToken delete error.',
                         extra={'user': request.user})
        messages.success(
            request,
            'Your Box.com account has been disconnected from DesignSafe.')

        return HttpResponseRedirect(reverse('box_integration:index'))

    return render(request, 'designsafe/apps/box_integration/disconnect.html')
