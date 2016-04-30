from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin

from designsafe.apps.api.data.agave.filemanager import FileManager as AgaveFileManager
#from designsafe.apps.api.data.agave.public_filemanager import FileManager as PublicFileManager
#from designsafe.apps.api.data.box.filemanager import FileManager as BoxFileManager

import logging
import json

logger = logging.getLogger(__name__)

class BaseDataView(SecureMixin, JSONResponseMixin, BaseApiView):
    #TODO: More elegant meta-programming.
    #TODO: Better way to check if it's an operation not permitted and to add operations.
    def _get_file_manager(self, request, **kwargs):
        resource = kwargs.get('resource', 'default')
        if resource == 'default':
            return AgaveFileManager(request, **kwargs)
        elif resource == 'public':
            return PublicFileManager(request, **kwargs)
        elif resource == 'box':
            return BoxFileManager(request, **kwargs)

    def _execute_operation(self, request, **kwargs):
        fm = self._get_file_manager(request, **kwargs)
        op = getattr(fm, kwargs.get('operation'))
        try:
            body_json = json.loads(request.body)
        except ValueError:
            body_json = {}
        files = request.FILES or []
        d = body_json
        d.update({'files': files})
        d.update(kwargs)
        resp = op(**kwargs)
        return resp

class DataView(BaseDataView):
    def get(self, request, *args, **kwargs):
        operation = kwargs.get('operation')
        if operation == 'file':
            raise ApiException('Operation not permitted', 400)
        resp = self._execute_operation(request, **kwargs)        
        if operation == 'listing' or operation == 'search':
            return self.render_to_json_response([o.to_dict() for o in resp])
        else:
            return self.render_to_json_response(resp.to_dict())

    def post(self, request, *args, **kwargs):
        operation = kwargs.get('operation')
        if operation != 'file':
            raise ApiException('Operation not permitted', 400)
        resp = self._execute_operation(request, **kwargs)        
        return self.render_to_json_response(resp.to_dict())

    def put(self, request, *args, **kwargs):
        operation = kwargs.get('operation')
        if operation != 'file':
            raise ApiException('Operation not permitted', 400)
        resp = self._execute_operation(request, **kwargs)        
        return self.render_to_json_response(resp.to_dict())

    def delete(self, request, *args, **kwargs):
        operation = kwargs.get('operation')
        if operation != 'file':
            raise ApiException('Operation not permitted', 400)
        resp = self._execute_operation(request, **kwargs)        
        return self.render_to_json_response(resp.to_dict())

class DataSearchView(BaseDataView):
    def get(self, request, *args, **kwargs):
        fm = self._get_file_manager(request, **kwargs)
        resp = fm.search(**kwargs)
        return self.render_to_json_response([o.to_dict() for o in resp])
