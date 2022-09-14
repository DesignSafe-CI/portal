from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.libs.common.decorators import profile as profile_fn
from django.contrib.auth import get_user_model
from django.http.response import HttpResponseForbidden
from django.http import JsonResponse
from django.apps import apps
from designsafe.apps.licenses.models import MATLABLicense, LSDYNALicense
from designsafe.apps.data.models.agave.util import AgaveJSONEncoder
import logging

logger = logging.getLogger(__name__)



class MATLABLicenseView(SecureMixin, BaseApiView):
    @profile_fn
    def get(self, request, username):
        if not request.user.is_superuser:
            return HttpResponseForbidden()

        MATLABLicense = apps.get_model('designsafe_licenses', 'MATLABLicense')
        active_licenses = MATLABLicense.objects.all()
        users_with_matlab_license = list(set([l.user for l in active_licenses]))
        licenses = []
        for user in users_with_matlab_license:
            if user.username == username:
                licenses = MATLABLicense.objects.filter(user=user)

        matlab_license = licenses[0].license_as_str() if len(licenses) > 0 else '' 
        return JsonResponse({'license': str(active_licenses)}, encoder=AgaveJSONEncoder)

class LSDYNALicenseView(SecureMixin, BaseApiView):
    @profile_fn
    def get(self, request, username):
        if not request.user.is_superuser:
            return HttpResponseForbidden()

        LSDYNALicense = apps.get_model('designsafe_licenses', 'LSDYNALicense')
        active_licenses = LSDYNALicense.objects.all()
        users_with_lsdyna_license = list(set([l.user for l in active_licenses]))
        licenses = []
        for user in users_with_lsdyna_license:
            if user.username == username:
                licenses = LSDYNALicense.objects.filter(user=user)

        lsdyna_license = licenses[0].license_as_str() if len(licenses) > 0 else ''
        return JsonResponse({'license': lsdyna_license}, encoder=AgaveJSONEncoder)
