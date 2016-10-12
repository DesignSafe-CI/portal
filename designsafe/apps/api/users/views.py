import logging
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.users import utils as users_utils
from django.contrib.auth import get_user_model
from django.forms.models import model_to_dict
from django.http import HttpResponseNotFound, JsonResponse
from django.views.generic.base import View

logger = logging.getLogger(__name__)


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
