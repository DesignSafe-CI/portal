"""
.. :module:: apps.workspace.api.views
   :synopsys: Views to handle Workspace API
"""

import logging
from django.http import JsonResponse
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import F, Count
from django.db.models.lookups import GreaterThan
from django.db.models.functions import Coalesce
from tapipy.errors import InternalServerError, UnauthorizedError
from designsafe.apps.api.views import AuthenticatedApiView
from designsafe.apps.api.utils import get_client_ip
from designsafe.apps.licenses.models import LICENSE_TYPES, get_license_info
from designsafe.libs.tapis.serializers import BaseTapisResultSerializer
from designsafe.apps.workspace.models.app_descriptions import AppDescription
from designsafe.apps.workspace.models.app_entries import (
    AppTrayCategory,
    AppVariant,
)


logger = logging.getLogger(__name__)
METRICS = logging.getLogger(f"metrics.{__name__}")


def _app_license_type(app_def):
    """Gets an app's license type, if any."""
    app_lic_type = getattr(app_def.notes, "licenseType", None)
    lic_type = app_lic_type if app_lic_type in LICENSE_TYPES else None
    return lic_type


def _get_user_app_license(license_type, user):
    """Gets a user's app license from the database."""
    _, license_models = get_license_info()
    license_model = next(
        (x for x in license_models if x.license_type == license_type), None
    )
    if not license_model:
        return None
    lic = license_model.objects.filter(user=user).first()
    return lic


def _get_app(app_id, app_version, user):
    """Gets an app from Tapis, and includes license and execution system info in response."""
    tapis = user.tapis_oauth.client
    if app_version:
        app_def = tapis.apps.getApp(appId=app_id, appVersion=app_version)
    else:
        app_def = tapis.apps.getAppLatestVersion(appId=app_id)
    data = {"definition": app_def}

    # GET EXECUTION SYSTEM INFO TO PROCESS SPECIFIC SYSTEM DATA E.G. QUEUE INFORMATION
    data["exec_sys"] = tapis.systems.getSystem(
        systemId=app_def.jobAttributes.execSystemId
    )

    lic_type = _app_license_type(app_def)
    data["license"] = {"type": lic_type}
    if lic_type is not None:
        lic = _get_user_app_license(lic_type, user)
        data["license"]["enabled"] = lic is not None

    return data


class AppsView(AuthenticatedApiView):
    """View for Tapis app listings."""

    def get(self, request, *args, **kwargs):
        """Gets an app by id or returns an entire app listing."""

        METRICS.info(
            "Apps",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "getAppsView",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"query": request.GET.dict()},
            },
        )
        tapis = request.user.tapis_oauth.client
        app_id = request.GET.get("appId")
        if app_id:
            app_version = request.GET.get("appVersion")
            data = _get_app(app_id, app_version, request.user)

            # Check if default storage system needs keys pushed
            if settings.PORTAL_DATAFILES_DEFAULT_STORAGE_SYSTEM:
                system_id = settings.PORTAL_DATAFILES_DEFAULT_STORAGE_SYSTEM["system"]
                system_def = tapis.systems.getSystem(systemId=system_id)

                try:
                    tapis.files.listFiles(systemId=system_id, path="/")
                except (InternalServerError, UnauthorizedError):
                    data["systemNeedsKeys"] = True
                    data["pushKeysSystem"] = system_def
        else:
            data = {"appListing": tapis.apps.getApps()}

        return JsonResponse(
            {
                "status": 200,
                "response": data,
            },
            encoder=BaseTapisResultSerializer,
        )


class AppsTrayView(AuthenticatedApiView):
    """Views for Workspace Apps Tray listings."""

    def _get_valid_apps(self, tapis_apps, portal_apps):
        """Only return Tapis apps that are known to exist and are enabled."""
        valid_tapis_apps = []
        for portal_app in portal_apps:
            portal_app_id = (
                f"{portal_app['app_id']}-{portal_app['version']}"
                if portal_app["version"]
                else portal_app["app_id"]
            )

            # Look for matching app in tapis apps list, and append tapis app label if portal app has no label
            matching_app = next(
                (
                    x
                    for x in sorted(tapis_apps, key=lambda y: y.version)
                    if portal_app_id in [x.id, f"{x.id}-{x.version}"]
                ),
                None,
            )
            if matching_app:
                valid_tapis_apps.append(
                    {
                        **portal_app,
                        "label": portal_app["label"] or matching_app.notes.label,
                    }
                )
        return valid_tapis_apps

    def _get_private_apps(self, user):
        """Returns a listing of non-public Tapis apps owned by or shared with the user."""
        tapis = user.tapis_oauth.client
        apps_listing = tapis.apps.getApps(
            select="version,id,notes", search="(enabled.eq.true)", listType="MINE"
        )
        my_apps = list(
            map(
                lambda app: {
                    "label": getattr(app.notes, "label", app.id),
                    "version": app.version,
                    "type": "tapis",
                    "appId": app.id,
                },
                apps_listing,
            )
        )

        return my_apps

    def _get_public_apps(self, user, verbose):
        """Returns a listing of public Tapis apps defined by the portal, sorted by category."""
        tapis = user.tapis_oauth.client
        apps_listing = tapis.apps.getApps(
            select="version,id,notes",
            search="(enabled.eq.true)",
            listType="SHARED_PUBLIC",
        )

        all_values = [
            "app_id",
            "app_type",
            "bundle_description",
            "bundle_href",
            "bundle_id",
            "bundle_is_popular",
            "bundle_is_simcenter",
            "bundle_label",
            "bundle_license_type",
            "bundle_related_apps",
            "bundle_tags",
            "html",
            "icon",
            "is_bundled",
            "label",
            "version",
        ]

        reduced_values = [
            "app_id",
            "app_type",
            "bundle_id",
            "bundle_label",
            "html",
            "icon",
            "is_bundled",
            "label",
            "version",
        ]

        values = reduced_values if not verbose else all_values

        categories = []
        # Traverse category records in descending priority
        for category in AppTrayCategory.objects.order_by("-priority"):
            # Retrieve all apps known to the portal in that category
            tapis_apps = list(
                AppVariant.objects.filter(
                    enabled=True,
                    bundle__enabled=True,
                    bundle__category=category,
                    app_type="tapis",
                )
                .order_by(Coalesce("label", "app_id"))
                # Only include bundle info if bundled
                .annotate(
                    icon=F("bundle__icon"),
                    is_bundled=GreaterThan(Count("bundle__appvariant"), 1),
                    bundle_description=F("bundle__description"),
                    bundle_href=F("bundle__href"),
                    bundle_is_popular=F("bundle__is_popular"),
                    bundle_is_simcenter=F("bundle__is_simcenter"),
                    bundle_label=F("bundle__label"),
                    bundle_license_type=F("bundle__license_type"),
                    bundle_related_apps=F("bundle__related_apps"),
                    bundle_tags=F("bundle__tags"),
                )
                .values(*values)
            )

            html_apps = list(
                AppVariant.objects.filter(
                    enabled=True,
                    bundle__enabled=True,
                    bundle__category=category,
                    app_type="html",
                )
                .order_by(Coalesce("label", "app_id"))
                # Only include bundle info if bundled
                .annotate(
                    icon=F("bundle__icon"),
                    is_bundled=GreaterThan(Count("bundle__appvariant"), 1),
                    bundle_description=F("bundle__description"),
                    bundle_href=F("bundle__href"),
                    bundle_is_popular=F("bundle__is_popular"),
                    bundle_is_simcenter=F("bundle__is_simcenter"),
                    bundle_label=F("bundle__label"),
                    bundle_license_type=F("bundle__license_type"),
                    bundle_related_apps=F("bundle__related_apps"),
                    bundle_tags=F("bundle__tags"),
                )
                .values(*values)
            )

            valid_tapis_apps = self._get_valid_apps(apps_listing, tapis_apps)

            category_result = {
                "title": category.category,
                "priority": category.priority,
                "apps": [
                    {k: v for k, v in app.items() if v != ""}
                    for app in valid_tapis_apps
                ]  # Remove empty strings from response
                + html_apps,
            }

            category_result["apps"] = sorted(
                category_result["apps"], key=lambda app: app["label"] or app["app_id"]
            )
            categories.append(category_result)

        return categories

    def get(self, request, *args, **kwargs):
        """
        Returns a structure containing app tray categories with the apps it contains

        {
            "categories": [
                {
                    "title": "Category 1",
                    "priority": 1,
                    "apps": [
                        {
                            "app_id": "jupyter-lab-hpc",
                            "app_type": "tapis",
                            "bundle_description: "Custom Jupyter notebooks.",
                            "bundle_href": "https://designsafe-ci.org/applications/overview/jupyter,
                            "bundle_id": 1,
                            "bundle_label": "Jupyter",
                            "bundle_license_type": "Open Source",
                            "bundle_is_popular": True,
                            "bundle_is_simcenter": False,
                            "bundle_related_apps": [],
                            "bundle_tags": [],
                            "html": "",
                            "icon": "jupyter",
                            "is_bundled": True,
                            "label": Jupyter Lab HPC,
                            "version": "1.0.0",
                            ...
                        },
                        ...
                    ],
                },
                ...
            ],
        }
        """
        METRICS.info(
            "Apps",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "getAppsTrayView",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"query": request.GET.dict()},
            },
        )

        public_only = request.GET.get("public_only", False)

        categories = self._get_public_apps(request.user, verbose=public_only)

        if not public_only:
            my_apps = self._get_private_apps(request.user)
            categories.insert(0, {"title": "My Apps", "apps": my_apps})

        # Only return categories that are non-empty
        categories = list(
            filter(lambda category: len(category["apps"]) > 0, categories)
        )

        return JsonResponse(
            {"categories": categories}, encoder=BaseTapisResultSerializer
        )


class AppDescriptionView(AuthenticatedApiView):
    """Views for retreiving AppDescription objects."""

    def get(self, request, *args, **kwargs):
        """Returns a dict response of the app_id's associated description, if any."""
        app_id = request.GET.get("app_id")
        try:
            data = AppDescription.objects.get(appid=app_id).desc_to_dict()
        except ObjectDoesNotExist:
            return JsonResponse({"message": f"No description found for {app_id}"})
        return JsonResponse({"response": data})
