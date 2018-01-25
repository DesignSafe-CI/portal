from django.http.response import HttpResponseBadRequest
from django.core.urlresolvers import reverse
from django.shortcuts import render, redirect

from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data import lookup_file_manager
from designsafe.apps.api.data.sources import SourcesApi
from designsafe.apps.api.notifications.models import Notification, Broadcast
from designsafe.libs.common.decorators import profile

import logging
import json

logger = logging.getLogger(__name__)


class SourcesView(SecureMixin, JSONResponseMixin, BaseApiView):

    def get(self, request, source_id=None, *args, **kwargs):
        api = SourcesApi()

        if source_id is not None:
            return self.render_to_json_response(api.get(source_id))

        return self.render_to_json_response(api.list())


class BaseDataView(JSONResponseMixin, BaseApiView):
    """
    Base View which instatiates corresponding file manager
    and execute correct operation.
    """
    #TODO: More elegant meta-programming.
    def _get_file_manager(self, request, resource, **kwargs):
        """
        Instantiates the correct file manager class

        Args:
            request: Request object. Used to get the user object.
            resource: Resource name to decide which class to instantiate.
        """
        user_obj = request.user
        fm_cls = lookup_file_manager(resource)
        if fm_cls:
            return fm_cls(user_obj, **kwargs)

    def _execute_operation(self, request, operation, **kwargs):
        """
        Executes operation of a file manager object.

        Args:
            request: Request object. Used to get the body of a post request and file array.
            operation: Operation to execute.
        """
        fm = self._get_file_manager(request, **kwargs)
        op = getattr(fm, operation)
        try:
            body_json = json.loads(request.body)
        except ValueError:
            body_json = {}
        d = body_json
        d.update(kwargs)
        d.update(request.GET.dict())
        resp = op(**d)
        return resp

    def _execute_form_operation(self, request, operation, **kwargs):
        """
        Executes operation of a file manager object as a traditional form post, i.e. NOT JSON.

        :param request: the HttpRequest object.
        :param operation: the operation to perform.
        :param kwargs:
        :return: HttpResponse
        """
        fm = self._get_file_manager(request, **kwargs)
        op = getattr(fm, operation)
        d = request.POST.dict()
        d.update(request.GET.dict())
        d.update(kwargs)
        if request.FILES:
            d['files'] = request.FILES
        resp = op(**d)
        return resp


class DataView(BaseDataView):
    """
    Data View to handle listing of a file or folder. GET HTTP Request.
    """
    @profile
    def get(self, request, *args, **kwargs):
        try:
            resp = self._execute_operation(request, 'listing', **kwargs)
            return self.render_to_json_response(resp)
        except ApiException as e:
            action_url = e.extra.get('action_url', None)
            action_label = e.extra.get('action_label', None)
            if action_url is None and e.response.status_code == 403:
                login_url = reverse('login')
                resource = kwargs.get('resource', None)
                file_id = kwargs.get('file_id', None)
                args = []
                if resource is not None:
                    args.append(resource)
                if file_id is not None:
                    args.append(file_id)
                data_url = reverse('designsafe_data:data_browser', args=args)
                redirect_url = '{}?next={}'.format(login_url, data_url)
                action_url = redirect_url
                action_label = 'Log in'

            resp = {
                'id': kwargs.get('file_id'),
                'source': kwargs.get('resource'),
                '_error': {
                    'status': e.response.status_code,
                    'message': e.response.reason,
                    'action_url': action_url,
                    'action_label': action_label
                }
            }
            return self.render_to_json_response(resp, status=e.response.status_code)


class DataFileManageView(BaseDataView):
    """
    Data View to handle file management. POST, PUT and DELETE Requests.

    If the request is POST or PUT it is expecting a JSON object in the body.
    The body JSON object should have at least these keys:
    - action: Operation to execute in the file manager.
    - path: File path on which the operation should be executed.

    The entire request body will be passed onto the file manager operation being executed
    as a python dictionary as well as the uploaded file array if present.
    """
    def _execute_post_operation(self, request, **kwargs):
        if 'action' in request.POST:
            operation = request.POST.get('action', None)
            if operation is not None:
                return self._execute_form_operation(request, operation, **kwargs)
        else:
            body_json = json.loads(request.body)
            operation = body_json.get('action', None)
            if operation is not None:
                return self._execute_operation(request, operation, **kwargs)

        return HttpResponseBadRequest('Invalid action')
    
    @profile
    def get(self, request, *args, **kwargs):
        operation = request.GET.get('action')
        fmt = request.GET.get('format', 'json')
        resp = self._execute_operation(request, operation, **kwargs)
        if fmt == 'html':
            return render(request, resp[0], resp[1])
        else:
            return self.render_to_json_response(resp)

    @profile
    def post(self, request, *args, **kwargs):
        resp = self._execute_post_operation(request, **kwargs)
        return self.render_to_json_response(resp)

    @profile
    def put(self, request, *args, **kwargs):
        resp = self._execute_post_operation(request, **kwargs)
        return self.render_to_json_response(resp)

    @profile
    def delete(self, request, *args, **kwargs):
        resp = self._execute_post_operation(request, **kwargs)
        return self.render_to_json_response(resp)

class DataSearchView(BaseDataView):
    """
    Data view to handle search.
    It will pass all the keyword arguments as well as the
    Query String parameters as a dictionary on to the `search`
    method of the file manager class.
    """
    def get(self, request, *args, **kwargs):
        resp = self._execute_operation(request, 'search', **kwargs)
        return self.render_to_json_response(resp)

class ProcessNotificationView(BaseDataView):
    """
    View to handle redirects from notification links
    """
    def get(self, request, pk, *args, **kwargs):
        n = Notification.objects.get(pk=pk)
        extra = n.extra_content
        logger.info('extra: {}'.format(extra))

        try:
            # target_path = extra['target_path']
            file_id = '%s%s' % (extra['system'], extra['trail'][-2]['path']) #path of the containing folder
        except KeyError as e:
            file_id = extra['id']

        target_path = reverse('designsafe_data:data_depot') + 'agave/' + file_id + '/'
        return redirect(target_path)
