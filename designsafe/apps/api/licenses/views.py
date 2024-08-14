"""Views for the licenses API."""

from django.contrib.auth import get_user_model
from django.http.response import HttpResponseForbidden, HttpResponseNotFound
from django.http import JsonResponse
from django.apps import apps
from designsafe.apps.api.views import AuthenticatedAllowJwtApiView
import logging

logger = logging.getLogger(__name__)


class LicenseView(AuthenticatedAllowJwtApiView):
    """View for retrieving licenses for a specific app."""

    def get(self, request, app_name):
        """Return the license for the given app."""
        if not request.user.is_staff:
            return HttpResponseForbidden()

        try:
            app_license = apps.get_model("designsafe_licenses", f"{app_name}License")
        except LookupError:
            return HttpResponseNotFound()
        username = request.GET.get("username", None)
        if not username:
            return HttpResponseNotFound()
        user = get_user_model().objects.get(username=username)
        licenses = app_license.objects.filter(user=user)

        user_license = licenses[0].license_as_str() if len(licenses) > 0 else ""
        return JsonResponse({"license": user_license})
