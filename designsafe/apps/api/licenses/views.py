from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.libs.common.decorators import profile as profile_fn
from django.contrib.auth import get_user_model
from django.http.response import HttpResponseForbidden, HttpResponseNotFound
from django.http import JsonResponse
from django.apps import apps
from designsafe.apps.licenses.models import MATLABLicense, LSDYNALicense
from designsafe.apps.data.models.agave.util import AgaveJSONEncoder
import logging

logger = logging.getLogger(__name__)



class LicenseView(SecureMixin, BaseApiView):
    @profile_fn
    def get(self, request, app_name, username):
        if not request.user.is_superuser:
            return HttpResponseForbidden()
        
        if app_name not in ['MATLAB','LSDYNA']:
            return HttpResponseNotFound()
        app_license = apps.get_model('designsafe_licenses', '{}License'.format(app_name))

        user = get_user_model().objects.get(username=username)
        licenses = app_license.objects.filter(user=user)

        user_license = licenses[0].license_as_str() if len(licenses) > 0 else '' 
        return JsonResponse({'license': user_license}, encoder=AgaveJSONEncoder)
