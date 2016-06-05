from django.http.response import HttpResponseBadRequest
from django.shortcuts import render

from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin

from django.contrib.auth import get_user_model

from designsafe.apps.api.users import utils as users_utils

import logging
import json

logger = logging.getLogger(__name__)

class SearchView(SecureMixin, JSONResponseMixin, BaseApiView):

    def get(self, request, *args, **kwargs):
        q = request.GET.get('q')
        query = users_utils.q_to_model_queries(q)
        if query is None:
            return self.render_to_json_response({})

        model = get_user_model()
        user_rs = model.objects.filter(query)
        resp = [{'first_name': u.first_name, 'last_name': u.last_name, 'email': u.email, 'username': u.username} for u in user_rs]
        return self.render_to_json_response(resp)
