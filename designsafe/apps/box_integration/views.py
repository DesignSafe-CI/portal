from boxsdk import OAuth2, Client
from boxsdk.exception import BoxOAuthException, BoxException
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
from designsafe.apps.box_integration.models import BoxUserToken
from designsafe.apps.box_integration.tasks import check_connection, copy_box_item
from designsafe.apps.box_integration.serializers import BoxObjectJsonSerializer
import logging
import json


logger = logging.getLogger(__name__)


class BoxAPIView(View):

    def __init__(self, **kwargs):
        self.box_api = None
        super(BoxAPIView, self).__init__(**kwargs)

    @method_decorator(login_required)
    @method_decorator(csrf_exempt)
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
        """
        Box doesn't support listing for a path, only by folder id; we have to start at
        folder_id=0 and iterate through the folder's children looking for a folder named
        after the next path component. On finding a folder for the next path component we
        record it and then repeat for subsequent path components. If any path component
        cannot be matched, an Http404 is raised.

        Args:
            request: The request
            path: The path to initialize the view with.

        Returns:
            A HttpResponse

        Raises:
            Http404 if the path is not found

        """
        folder_id = 0
        if path is not None:
            path_c = path.split('/')
            for c in path_c:
                limit = 100
                offset = 0
                next_folder_id = None
                while next_folder_id is None:
                    children = self.box_api.folder(folder_id).get_items(limit=limit,
                                                                        offset=offset)
                    for child in children:
                        if child.type == 'folder':
                            if child.name == c:
                                next_folder_id = child.object_id
                                break
                    if len(children) == limit:
                        offset += limit
                    elif next_folder_id is None:  # this can happen if path doesn't exist
                        raise Http404('The Box path "%s" does not exist.' %
                                      path)
                folder_id = next_folder_id

        folder = self.box_api.folder(folder_id).get()
        context = {
            'angular_init': json.dumps({'folder': folder}, cls=BoxObjectJsonSerializer),
        }

        return render(request, 'designsafe/apps/box_integration/files.html', context)


class BoxFilesJsonView(BoxAPIView):

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

    def put(self, request, item_type, item_id):

        body_unicode = request.body.decode('utf-8')
        body_data = json.loads(body_unicode)
        logger.debug(body_data)
        action = body_data.get('action', None)
        resp_data = {}

        if action == 'copy':
            op = getattr(self.box_api, item_type)
            item = op(item_id).get()

            target_system = settings.AGAVE_STORAGE_SYSTEM
            target_dir = '%s/%s' % (request.user.username, body_data.get('dir', ''))

            task_args = (request.user.username, item.type, item.object_id, target_system,
                         target_dir)
            task = copy_box_item.apply_async(args=task_args, countdown=10)

            logger.debug('Scheduled Box Copy', extra={
                'username': request.user.username,
                'context': {
                    'box_item_type': item_type,
                    'box_item_id': item_id,
                    'task_id': task.id
                }
            })
            resp_data['result'] = {'task_id': task.id}
            resp_data['message'] = 'Item copy scheduled.'
            resp_status = 202
        else:
            resp_data['message'] = 'Unknown item action: {0}'.format(action)
            resp_status = 400
        return HttpResponse(json.dumps(resp_data), status=resp_status,
                            content_type='application/json')


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
