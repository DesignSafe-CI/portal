import logging
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.users import utils as users_utils
from django.contrib.auth import get_user_model
from django.forms.models import model_to_dict
from django.http import HttpResponseNotFound, JsonResponse, HttpResponse
from django.views.generic.base import View

logger = logging.getLogger(__name__)

class AuthenticatedView(View):

    def get(self, request):
        logger.info(request.user.__dict__)
        if request.user.is_authenticated():
            u = request.user
            out = {
                "first_name": u.first_name,
                "username": u.username,
                "last_name": u.last_name,
                "email": u.email,
                "oauth": {
                    "access_token": u.agave_oauth.access_token,
                    "expires_in": u.agave_oauth.expires_in,
                    "scope": u.agave_oauth.scope,
                }
            }

            return JsonResponse(out)
        return HttpResponse('Unauthorized', status=401)


class SearchView(SecureMixin, View):

    def get(self, request):
        resp_fields = ['first_name', 'last_name', 'email', 'username']

        model = get_user_model()
        q = request.GET.get('username')
        if q:
            user = model.objects.get(username=q)
            return JsonResponse(model_to_dict(user, fields=resp_fields))

        q = request.GET.get('q')

        if q:
            query = users_utils.q_to_model_queries(q)
            if query is None:
                return JsonResponse({})

            user_rs = model.objects.filter(query)
            resp = [model_to_dict(u, fields=resp_fields) for u in user_rs]
            return JsonResponse(resp, safe=False)

        return HttpResponseNotFound()
