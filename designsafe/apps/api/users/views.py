import logging
import json
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.users import utils as users_utils
from django.contrib.auth import get_user_model
from django.forms.models import model_to_dict
from django.http import HttpResponseNotFound, JsonResponse, HttpResponse, HttpRequest
from django.views.generic.base import View
from django.core.exceptions import ObjectDoesNotExist
from pytas.http import TASClient
from designsafe.apps.api.views import BaseApiView, ApiException
from designsafe.apps.data.models.elasticsearch import IndexedFile, IndexedPublication
from designsafe.libs.elasticsearch.utils import new_es_client
from elasticsearch_dsl import Q, Search

logger = logging.getLogger(__name__)

def check_public_availability(username):
    es_client = new_es_client()
    query = Q({'multi_match': {'fields': ['project.value.teamMembers', 
                                          'project.value.coPis', 
                                          'project.value.pi'], 
                               'query': username}})
    res = IndexedPublication.search(using=es_client).filter(query).execute()
    return res.hits.total.value > 0


class UsageView(SecureMixin, View):

    def get(self, request):
        current_user = request.user
        q = IndexedFile.search()\
                .query('bool', must=[Q("prefix", **{"path._exact": '/' + current_user.username})])\
                .extra(size=0)
        q.aggs.metric('total_storage_bytes', 'sum', field="length")
        result = q.execute()
        agg = result.to_dict()["aggregations"]
        out = {"total_storage_bytes": agg["total_storage_bytes"]["value"]}
        return JsonResponse(out)

class AuthenticatedView(View):

    def get(self, request):
        if request.user.is_authenticated:
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


class SearchView(View):

    def get(self, request):
        resp_fields = ['first_name', 'last_name', 'email', 'username']
        model = get_user_model()
        q = request.GET.get('username')

        # Do not return user details if the user is not part of a public project.
        if not request.user.is_authenticated and not check_public_availability(q):
            return JsonResponse({})

        if q:
            try:
                user = model.objects.get(username=q)
            except ObjectDoesNotExist as err:
                return HttpResponseNotFound()
            res_dict = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'username': user.username,
            }
            if(user.profile.orcid_id):
                res_dict['orcid_id'] = user.profile.orcid_id
            try:
                user_tas = TASClient().get_user(username=q)
                res_dict['profile'] = {
                    'institution': user_tas['institution']
                }
            except Exception as err:
                logger.info('No Profile.')

            return JsonResponse(res_dict)

        # Prevent unauthenticated users from performing a query
        if not request.user.is_authenticated:
            return JsonResponse({})

        q = request.GET.get('q')
        role = request.GET.get('role')
        user_rs = model.objects.filter()
        if q:
            query = users_utils.q_to_model_queries(q)
            if query is None:
                return JsonResponse({})

            user_rs = user_rs.filter(query)
        if role:
            logger.info(role)
            user_rs = user_rs.filter(groups__name=role)

        # Prevent endpoint from returning unfiltered user list.
        if not q and not role:
            return HttpResponseNotFound()

        resp = [model_to_dict(u, fields=resp_fields) for u in user_rs]
        if len(resp):
            return JsonResponse(resp, safe=False)
        else:
            return HttpResponseNotFound()
        

class ProjectUserView(BaseApiView):
    """View for handling search for project users"""
    def get(self, request: HttpRequest):
        """retrieve a user by their exact TACC username."""
        if not request.user.is_authenticated:
            raise ApiException(message="Authentication required", status=401)
        
        username_query = request.GET.get("q")
        user_match = get_user_model().objects.filter(username__iexact=username_query)
        user_resp = [{"fname": u.first_name,
                     "lname": u.last_name,
                     "inst": u.profile.institution,
                     "email": u.email, 
                     "username": u.username} for u in user_match]
        
        return JsonResponse({"result": user_resp})
        


class PublicView(View):

    def get(self, request):
        model = get_user_model()
        nl = json.loads(request.GET.get('usernames'))

        res_list = []

        try:
            users = []
            for username in nl:
                # Do not return user details if the user is not part of a public project.
                if not request.user.is_authenticated and not check_public_availability(username):
                    continue
                try:
                    users.append(model.objects.get(username=username))
                except model.DoesNotExist:
                    continue

            for user in users:
                data = {
                    'fname': user.first_name,
                    'lname': user.last_name,
                    'username': user.username,
                    'email': user.email,
                }
                res_list.append(data)
        except ObjectDoesNotExist as err:
            return HttpResponseNotFound()

        res_dict = {"userData": res_list}
        return JsonResponse(res_dict)
