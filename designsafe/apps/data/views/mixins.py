from django.views.generic.base import View as BaseView
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.conf import settings

class PermissionRequiredMixin(object):
    """
    View mixin which checks if user is logged in.
    TODO: check necessary permissions.
    """

    @method_decorator(login_required)
    def dispatch(self, *args, **kwargs):
        return super(PermissionRequiredMixin, self).dispatch(*args, **kwargs)

class SystemVarsMixin(object):
    """
    View mixin to set local variables needed to talk to agave an other APIs
    e.g. access_token, filesystem, etc...
    """

    def get_system_vars(self, request, **kwargs):
        ret = {}
        
        ret.setdefault('token', request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID')))
        ret.setdefault('access_token', self.token.get('access_token', None))
        ret.setdefault('url', getattr(settings, 'AGAVE_TENANT_BASEURL'))
        #TODO: Getting the filesystem should check in which system is the user in or requesting.
        ret.setdefault('filesystem', getattr(settings, 'AGAVE_STORAGE_SYSTEM'))
        ret.update(kwargs)
        return ret

class JSONResponseMixin(object):
    """
    View mixin to return a JSON response. 
    We're building one so we can put any extra code in here.
    """

    def render_to_json_response(self, context, **response_kwargs):
        return HttpResponse(json.dumps(context, cls=DjangoJSONEncoder), content_type = response_kwargs['content_type'], status = response_kwargs['status'])
