import json
import logging

# from agavepy.agave import Agave, AgaveException
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse
from django.utils.decorators import method_decorator

logger = logging.getLogger(__name__)

class JSONResponseMixin:
    """
    View mixin to return a JSON response.
    We're building one so we can put any extra code in here.
    """

    def render_to_json_response(self, context, **response_kwargs):
        response_kwargs['status'] = response_kwargs.get('status', 200)
        response_kwargs['content_type'] = 'application/json'
        return HttpResponse(json.dumps(context, cls=DjangoJSONEncoder), **response_kwargs)

class SecureMixin:
    """
    View mixin to use login_required
    """
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
