"""
.. :module:: apps.workspace.api.views
   :synopsys: Views to handle Workspace API
"""

import logging
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.db.models import F, Count
from django.db.models.lookups import GreaterThan
from django.db.models.functions import Coalesce
from tapipy.errors import BaseTapyException, InternalServerError, UnauthorizedError
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.licenses.models import LICENSE_TYPES, get_license_info
from designsafe.libs.tapis.serializers import BaseTapisResultSerializer
from designsafe.apps.workspace.models.app_entries import (
    AppListingEntry,
    AppTrayCategory,
    AppVariant,
)


logger = logging.getLogger(__name__)
METRICS = logging.getLogger("metrics.{}".format(__name__))


def _app_license_type(app_def):
    app_lic_type = getattr(app_def.notes, "licenseType", None)
    lic_type = app_lic_type if app_lic_type in LICENSE_TYPES else None
    return lic_type


def _get_user_app_license(license_type, user):
    _, license_models = get_license_info()
    license_model = next(
        (x for x in license_models if x.license_type == license_type), None
    )
    if not license_model:
        return None
    lic = license_model.objects.filter(user=user).first()
    return lic


def _get_app(app_id, app_version, user):
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


@method_decorator(login_required, name="dispatch")
class AppsView(BaseApiView):
    def get(self, request, *args, **kwargs):
        tapis = request.user.tapis_oauth.client
        app_id = request.GET.get("appId")
        if app_id:
            app_version = request.GET.get("appVersion")
            METRICS.info(
                "user:{} is requesting app id:{} version:{}".format(
                    request.user.username, app_id, app_version
                )
            )
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
            METRICS.info("user:{} is requesting all apps".format(request.user.username))
            data = {"appListing": tapis.apps.getApps()}

        return JsonResponse(
            {
                "status": 200,
                "response": data,
            },
            encoder=BaseTapisResultSerializer,
        )


@method_decorator(login_required, name="dispatch")
class AppsTrayView(BaseApiView):

    def _get_valid_apps(self, tapis_apps, portal_apps):
        """Only return Tapis apps that are known to exist and are enabled"""
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

    def _getPrivateApps(self, user):
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

    def _getPublicApps(self, user):
        tapis = user.tapis_oauth.client
        apps_listing = tapis.apps.getApps(
            select="version,id,notes",
            search="(enabled.eq.true)",
            listType="SHARED_PUBLIC",
        )

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
                .annotate()
                .annotate(
                    icon=F("bundle__icon"),
                    is_bundled=GreaterThan(Count("bundle__appvariant"), 1),
                    bundle_label=F("bundle__label"),
                    bundle_popular=F("bundle__popular"),
                )
                .values(
                    "app_id",
                    "bundle_id",
                    "bundle_label",
                    "bundle_popular",
                    "icon",
                    "is_bundled",
                    "label",
                    "license_type",
                    "version",
                )
            )
            html_apps = list(
                AppListingEntry.objects.filter(
                    enabled=True,
                    bundle__enabled=True,
                    bundle__category=category,
                    app_type="html",
                )
                .order_by(Coalesce("label", "app_id"))
                .values(
                    "app_id",
                    "app_type",
                    "bundle_id",
                    "bundle_label",
                    "html",
                    "icon",
                    "label",
                    "license_type",
                    "popular",
                    "version",
                )
            )

            valid_tapis_apps = self._get_valid_apps(apps_listing, tapis_apps)

            categoryResult = {
                "title": category.category,
                "priority": category.priority,
                "apps": [
                    {k: v for k, v in app.items() if v != ""}
                    for app in valid_tapis_apps
                ]  # Remove empty strings from response
                + html_apps,
            }

            categoryResult["apps"] = sorted(
                categoryResult["apps"], key=lambda app: app["label"] or app["app_id"]
            )
            categories.append(categoryResult)

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
                            "bundle_id": 1,
                            "bundle_label": "Jupyter",
                            "bundle_popular": True,
                            "icon": "jupyter",
                            "is_bundled": True,
                            "label": Jupyter Lab HPC,
                            "license_type": "Open Source",
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
        METRICS.info("user:%s op:%s" % (request.user.username, "getAppsTrayView"))

        categories = self._getPublicApps(request.user)
        my_apps = self._getPrivateApps(request.user)

        categories.insert(0, {"title": "My Apps", "apps": my_apps})

        # Only return categories that are non-empty
        categories = list(
            filter(lambda category: len(category["apps"]) > 0, categories)
        )

        return JsonResponse(
            {"categories": categories}, encoder=BaseTapisResultSerializer
        )
