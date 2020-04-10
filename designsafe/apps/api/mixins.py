from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from designsafe.apps.api.decorators import agave_jwt_login
from django.http import HttpResponse
from django.core.serializers.json import DjangoJSONEncoder
import logging
import json

logger = logging.getLevelName(__name__)


class JSONResponseMixin(object):
    """
    View mixin to return a JSON response. 
    We're building one so we can put any extra code in here.
    """

    def render_to_json_response(self, context, **response_kwargs):
        response_kwargs['status'] = response_kwargs.get('status', 200)
        response_kwargs['content_type'] = 'application/json'
        return HttpResponse(json.dumps(context, cls=DjangoJSONEncoder), **response_kwargs)


class SecureMixin(object):
    """View mixin to ensure the user has access to a secured view

    This Mixin first checks if the request is done using a JWT. If this is not the case
    then it will continue and check if the request is using a regular django session cookie.
    Either way the request will be correctly authenticated. This way we can easily
    use the same API endpoints and put them behind WSO2.

    TODO: When moving into Django 1.9 @method_decorator(login_required)
    should be a class wrapper @method_decorator(login_required, name='dispatch')
    as per: https://docs.djangoproject.com/en/1.9/topics/class-based-views/intro/#decorating-the-class
    """
    @method_decorator(agave_jwt_login)
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(SecureMixin, self).dispatch(request, *args, **kwargs)
