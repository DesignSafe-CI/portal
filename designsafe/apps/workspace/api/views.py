"""
.. :module:: apps.workspace.api.views
   :synopsys: Views to handle Workspace API
"""

import logging
import json
from urllib.parse import urlparse
from django.http import JsonResponse
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import F, Count
from django.db.models.lookups import GreaterThan
from django.urls import reverse
from tapipy.tapis import TapisResult
from tapipy.errors import InternalServerError, UnauthorizedError, BaseTapyException
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.users.utils import get_user_data
from designsafe.apps.api.views import AuthenticatedApiView
from designsafe.apps.api.utils import get_client_ip
from designsafe.apps.licenses.models import LICENSE_TYPES, get_license_info
from designsafe.libs.tapis.serializers import BaseTapisResultSerializer
from designsafe.apps.workspace.models.app_descriptions import AppDescription
from designsafe.apps.workspace.models.app_entries import (
    AppTrayCategory,
    AppVariant,
)
from designsafe.apps.api.users.utils import get_allocations
from designsafe.apps.workspace.api.utils import check_job_for_timeout
from designsafe.apps.onboarding.steps.system_access_v3 import create_system_credentials
from django.views import View
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth.mixins import LoginRequiredMixin
from designsafe.apps.workspace.models.user_favorites import UserFavorite


logger = logging.getLogger(__name__)
METRICS = logging.getLogger(f"metrics.{__name__}")

TACC_EXEC_SYSTEMS = {
    "corral": {
        "work_dir": "/work2/{}",
        "scratch_dir": "/work2/{}",
        "home_dir": "/home/{}",
    },
    "stampede3": {
        "work_dir": "/work2/{}",
        "scratch_dir": "/scratch/{}",
        "home_dir": "/home1/{}",
    },
    "frontera": {
        "work_dir": "/work2/{}",
        "scratch_dir": "/scratch1/{}",
        "home_dir": "/home1/{}",
    },
    "ls6": {
        "work_dir": "/work/{}",
        "scratch_dir": "/scratch/{}",
        "home_dir": "/home1/{}",
    },
}


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


def _get_systems(
    user: object, can_exec: bool, systems: list = None, list_type: str = "ALL"
) -> list:
    """List of all enabled systems of the specified can_exec type available for the user."""
    tapis = user.tapis_oauth.client

    search_string = f"(canExec.eq.{can_exec})~(enabled.eq.true)"

    if systems:
        system_id_search = ",".join(systems)
        search_string += f"~(id.in.{system_id_search})"
    return tapis.systems.getSystems(
        listType=list_type, select="allAttributes", search=search_string
    )


def _get_app(app_id, app_version, user):
    """Gets an app from Tapis, and includes license and execution system info in response."""

    tapis = user.tapis_oauth.client
    if app_version:
        app_def = tapis.apps.getApp(appId=app_id, appVersion=app_version)
    else:
        app_def = tapis.apps.getAppLatestVersion(appId=app_id)

    data = {"definition": app_def}

    lic_type = _app_license_type(app_def)
    data["license"] = {"type": lic_type}
    if lic_type is not None:
        lic = _get_user_app_license(lic_type, user)
        data["license"]["enabled"] = lic is not None

    return data


def test_system_access_ok(
    tapis: object, username: str, system_id: str, path: str = "/"
) -> bool:
    """
    Test system access by attempting to list files in a given path.
    """
    try:
        tapis.files.listFiles(systemId=system_id, path=path, limit=1)
        return True
    except UnauthorizedError:
        return False
    except BaseTapyException:
        logger.exception(
            "System access check failed for user: %s on system: %s", username, system_id
        )
        raise


def test_system_needs_keys(
    tapis: object, username: str, system_id: str, path: str = "/"
) -> bool:
    """Tests a Tapis system by making a file listing call.

    If the system is TMS_KEYS-based, it attempts to create credentials before listing files.

    Args:
        tapis (Tapis): An instance of the Tapis client.
        username (str)): The user to create credentials.
        system_id (str): The ID of the Tapis system to test.

    Returns:
        bool
    """
    try:
        tapis.systems.checkUserCredential(systemId=system_id, userName=username)
        return False
    except (InternalServerError, UnauthorizedError) as exc:
        system_def = tapis.systems.getSystem(systemId=system_id)

        # Check if the system uses TMS_KEYS and create credentials if necessary
        if system_def.get("defaultAuthnMethod") == "TMS_KEYS":
            try:
                create_system_credentials(
                    tapis, username, system_id, createTmsKeys=True
                )
                return False
            except (InternalServerError, UnauthorizedError):
                logger.exception(
                    f"TMS_KEYS credential generation failed for system: {system_id}, user: {username}"
                )
                raise

        # If the system uses PKI_KEYS, check if the user has access
        if (
            system_def.get("effectiveUserId") == username
            and system_def.get("defaultAuthnMethod") == "PKI_KEYS"
        ):
            return test_system_access_ok(tapis, username, system_id, path)

        raise ApiException(
            f"User {username} does not have system credentials and cannot push keys or create credentials for system {system_id}."
        ) from exc


class SystemListingView(AuthenticatedApiView):
    """System Listing View"""

    def get(self, request):
        """Returns a listing of execution and storage systems for the user"""
        execution_systems = _get_systems(request.user, can_exec=True)
        storage_systems = _get_systems(
            request.user, can_exec=False, list_type="SHARED_PUBLIC"
        )
        response = {
            "executionSystems": execution_systems,
            "storageSystems": storage_systems,
        }

        default_storage_system_id = settings.AGAVE_STORAGE_SYSTEM
        if default_storage_system_id:
            response["defaultStorageSystem"] = next(
                (sys for sys in storage_systems if sys.id == default_storage_system_id),
                None,
            )

        return JsonResponse(
            {"status": 200, "response": response}, encoder=BaseTapisResultSerializer
        )


class SystemDefinitionView(AuthenticatedApiView):
    """System Definition View"""

    def get(self, request, system_id):
        """Get definitions for individual systems"""
        client = request.user.tapis_oauth.client
        system_def = client.systems.getSystem(systemId=system_id)
        return JsonResponse(
            {"status": 200, "response": system_def}, encoder=BaseTapisResultSerializer
        )


class AppsView(AuthenticatedApiView):
    """View for Tapis app listings."""

    def get(self, request, *args, **kwargs):
        """Gets an app by id or returns an entire app listing."""

        METRICS.info(
            "Apps",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "getApp",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"query": request.GET.dict()},
            },
        )
        app_id = request.GET.get("appId")
        app_version = request.GET.get("appVersion", "")

        if not app_id:
            raise ApiException("Missing required parameter: app_id", status=422)

        try:
            portal_app = AppVariant.objects.get(app_id=app_id, version=app_version)
            if portal_app.app_type == "html":
                data = {
                    "definition": {
                        "id": portal_app.app_id,
                        "notes": {"label": portal_app.label or portal_app.bundle.label},
                    }
                }
            else:
                data = _get_app(app_id, app_version, request.user)

        except ObjectDoesNotExist:
            data = _get_app(app_id, app_version, request.user)

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
                (portal_app["app_id"], portal_app["version"])
                if portal_app["version"]
                else portal_app["app_id"]
            )

            # Look for matching app in tapis apps list, and append tapis app label if portal app has no label
            matching_app = next(
                (
                    x
                    for x in sorted(tapis_apps, key=lambda y: y.version)
                    if portal_app_id in [x.id, (x.id, x.version)]
                ),
                None,
            )
            if matching_app:
                valid_tapis_apps.append(
                    {
                        **portal_app,
                        "label": portal_app["label"] or matching_app.notes.get("label"),
                        "shortLabel": portal_app["short_label"]
                        or matching_app.notes.get("shortLabel"),
                        "userGuideLink": portal_app["bundle_user_guide_link"],
                    }
                )
        return valid_tapis_apps

    def _get_private_apps(self, user):
        """Returns a listing of non-public Tapis apps owned by or shared with the user."""

        tapis = user.tapis_oauth.client
        apps_listing = tapis.apps.getApps(
            select="version,id,notes",
            search="(versionEnabled.eq.true)~(enabled.eq.true)~(version.like.*)",
            listType="MINE",
            limit=-1,
        )
        my_apps = list(
            map(
                lambda app: {
                    "app_id": app.id,
                    "app_type": "tapis",
                    "bundle_id": None,
                    "bundle_label": None,
                    "html": None,
                    "icon": getattr(app.notes, "icon", None),
                    "is_bundled": False,
                    "label": getattr(app.notes, "label", app.id),
                    "shortLabel": getattr(app.notes, "shortLabel", None),
                    "version": app.version,
                },
                apps_listing,
            )
        )

        return my_apps

    # pylint: disable-msg=too-many-locals
    def _get_public_apps(self, user, verbose):
        """Returns a listing of public Tapis apps defined by the portal, sorted by category."""

        tapis = user.tapis_oauth.client
        apps_listing = tapis.apps.getApps(
            select="version,id,notes",
            search="(versionEnabled.eq.true)~(enabled.eq.true)~(version.like.*)",
            listType="SHARED_PUBLIC",
            limit=-1,
        )

        all_values = [
            "app_id",
            "app_type",
            "bundle_category",
            "bundle_description",
            "bundle_href",
            "bundle_id",
            "bundle_is_popular",
            "bundle_is_simcenter",
            "bundle_label",
            "bundle_license_type",
            "bundle_user_guide_link",
            "bundle__related_apps",
            "bundle__tags",
            "html",
            "icon",
            "is_bundled",
            "label",
            "priority",
            "short_label",
            "version",
        ]

        reduced_values = [
            "app_id",
            "app_type",
            "bundle_category",
            "bundle_href",
            "bundle_id",
            "bundle_label",
            "bundle_user_guide_link",
            "html",
            "icon",
            "is_bundled",
            "label",
            "priority",
            "short_label",
            "version",
        ]

        values = reduced_values if not verbose else all_values

        categories = []
        html_definitions = {}
        # Traverse category records in descending priority
        for category in AppTrayCategory.objects.order_by("priority"):
            # Retrieve all apps known to the portal in that category
            tapis_apps = list(
                AppVariant.objects.filter(
                    enabled=True,
                    bundle__enabled=True,
                    bundle__category=category,
                    app_type="tapis",
                )
                # Only include bundle info if bundled
                .annotate(
                    icon=F("bundle__icon"),
                    is_bundled=GreaterThan(Count("bundle__appvariant"), 1),
                    bundle_category=F("bundle__category__category"),
                    bundle_description=F("bundle__description"),
                    bundle_href=F("bundle__href"),
                    bundle_is_popular=F("bundle__is_popular"),
                    bundle_is_simcenter=F("bundle__is_simcenter"),
                    bundle_label=F("bundle__label"),
                    bundle_license_type=F("bundle__license_type"),
                    bundle_user_guide_link=F("bundle__user_guide_link"),
                ).values(*values)
            )

            html_apps = list(
                AppVariant.objects.filter(
                    enabled=True,
                    bundle__enabled=True,
                    bundle__category=category,
                    app_type="html",
                )
                # Only include bundle info if bundled
                .annotate(
                    icon=F("bundle__icon"),
                    is_bundled=GreaterThan(Count("bundle__appvariant"), 1),
                    bundle_category=F("bundle__category__category"),
                    bundle_description=F("bundle__description"),
                    bundle_href=F("bundle__href"),
                    bundle_is_popular=F("bundle__is_popular"),
                    bundle_is_simcenter=F("bundle__is_simcenter"),
                    bundle_label=F("bundle__label"),
                    bundle_license_type=F("bundle__license_type"),
                    bundle_user_guide_link=F("bundle__user_guide_link"),
                ).values(*values)
            )

            valid_tapis_apps = self._get_valid_apps(apps_listing, tapis_apps)

            category_result = {
                "title": category.category,
                "priority": category.priority,
                "apps": valid_tapis_apps,
            }

            # Add html apps to html_definitions
            for html_app in html_apps:
                html_app["userGuideLink"] = html_app.get("bundle_user_guide_link", "")
                html_definitions[html_app["app_id"]] = html_app
                category_result["apps"].append(html_app)

            category_result["apps"] = sorted(
                category_result["apps"], key=lambda app: app["label"] or app["app_id"]
            )
            categories.append(category_result)

        return categories, html_definitions

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
                            "bundle_category": "Analysis",
                            "bundle_description: "Custom Jupyter notebooks.",
                            "bundle_href": "https://designsafe-ci.org/applications/overview/jupyter,
                            "bundle_id": 1,
                            "bundle_label": "Jupyter",
                            "bundle_license_type": "Open Source",
                            "bundle_is_popular": True,
                            "bundle_is_simcenter": False,
                            "bundle_related_apps": [],
                            "bundle_tags": [],
                            "bundle_user_guide_link": "https://www.designsafe-ci.org/user-guide/tools/jupyterhub/#designsafe-hpc-jupyter-guide",
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
                "operation": "getApps",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"query": request.GET.dict()},
            },
        )

        public_only = request.GET.get("public_only", False)

        categories, html_definitions = self._get_public_apps(
            request.user, verbose=public_only
        )

        if not public_only:
            my_apps = self._get_private_apps(request.user)
            categories.insert(0, {"title": "My Apps", "apps": my_apps})

        # Only return categories that are non-empty
        categories = list(
            filter(lambda category: len(category["apps"]) > 0, categories)
        )

        return JsonResponse(
            {"categories": categories, "htmlDefinitions": html_definitions},
            encoder=BaseTapisResultSerializer,
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


class JobHistoryView(AuthenticatedApiView):
    """View for returning job history"""

    def get(self, request, job_uuid):
        """Returns an array of job history events for a given job uuid"""
        tapis = request.user.tapis_oauth.client
        data = tapis.jobs.getJobHistory(jobUuid=job_uuid)
        return JsonResponse(
            {
                "status": 200,
                "response": data,
            },
            encoder=BaseTapisResultSerializer,
        )


class JobsView(AuthenticatedApiView):
    """Views for Workspace Jobs API"""

    def get(self, request, operation=None):
        """Handles get requests for Jobs API"""

        allowed_actions = ["listing", "search", "select"]

        tapis = request.user.tapis_oauth.client

        if operation not in allowed_actions:
            raise ApiException(
                f"user: {request.user.username} is trying to run an unsupported job operation: {operation}",
                status=400,
            )

        METRICS.info(
            "Jobs",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": operation,
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"query": request.GET.dict()},
            },
        )

        tapis_operation = getattr(self, operation)
        data = tapis_operation(tapis, request)

        if isinstance(data, list):
            for index, job in enumerate(data):
                data[index] = check_job_for_timeout(job)
        else:
            data = check_job_for_timeout(data)

        return JsonResponse(
            {
                "status": 200,
                "response": data,
            },
            encoder=BaseTapisResultSerializer,
        )

    def select(self, client, request):
        """Returns detailed information for a given job uuid"""

        job_uuid = request.GET.get("uuid")
        data = client.jobs.getJob(
            jobUuid=job_uuid,
            headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"},
        )

        return data

    def listing(self, client, request):
        """Returns a listing of jobs for the user"""

        limit = int(request.GET.get("limit", 10))
        skip = int(request.GET.get("skip", 0))
        filter_by_portal = request.GET.get("filterByPortal", False)
        portal_name = settings.PORTAL_NAMESPACE

        kwargs = {}
        if filter_by_portal:
            kwargs["_tapis_query_parameters"] = {
                "tags.contains": f"portalName: {portal_name}"
            }

        data = client.jobs.getJobSearchList(
            limit=limit,
            skip=skip,
            orderBy="lastUpdated(desc),name(asc)",
            select="allAttributes",
            headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"},
            **kwargs,
        )
        if isinstance(data, list):
            for index, job in enumerate(data):
                data[index] = check_job_for_timeout(job)
        else:
            data = check_job_for_timeout(data)

        return {"listing": data, "reachedEnd": len(data) < int(limit)}

    def search(self, client, request):
        """
        Search using tapis in specific portal with providing query string.
        Additonal parameters for search:
        limit - limit param from request, otherwise default to 10
        skip - skip param from request, otherwise default to 0
        """

        query_string = request.GET.get("query_string")

        limit = int(request.GET.get("limit", 10))
        skip = int(request.GET.get("skip", 0))
        filter_by_portal = request.GET.get("filterByPortal", False)
        portal_name = settings.PORTAL_NAMESPACE

        sql_queries = []
        if filter_by_portal:
            sql_queries.append(f"(tags IN ('portalName: {portal_name}')) AND")

        sql_queries += [
            f"((name like '%{query_string}%') OR",
            f"(archiveSystemDir like '%{query_string}%') OR",
            f"(appId like '%{query_string}%') OR",
            f"(archiveSystemId like '%{query_string}%'))",
        ]

        data = client.jobs.getJobSearchListByPostSqlStr(
            limit=limit,
            skip=skip,
            orderBy="lastUpdated(desc),name(asc)",
            request_body={"search": sql_queries},
            select="allAttributes",
            headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"},
        )
        return {"listing": data, "reachedEnd": len(data) < int(limit)}

    def delete(self, request, *args, **kwargs):
        """Hides a job from the history listing view"""

        METRICS.info(
            "Jobs",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "delete",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"query": request.GET.dict()},
            },
        )
        tapis = request.user.tapis_oauth.client
        job_uuid = request.GET.get("uuid")
        data = tapis.jobs.hideJob(
            jobUuid=job_uuid,
            headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"},
        )
        return JsonResponse(
            {
                "status": 200,
                "response": data,
            },
            encoder=BaseTapisResultSerializer,
        )

    # pylint: disable-msg=too-many-locals
    def _submit_job(self, request, body, tapis, username):
        job_post = body.get("job")
        if not job_post:
            raise ApiException(
                f"user: {username} is submitting a request with no job body.",
                status=400,
            )

        # Provide default job archive configuration if none is provided
        if not job_post.get("archiveSystemId"):
            job_post["archiveSystemId"] = settings.AGAVE_STORAGE_SYSTEM
        if not job_post.get("archiveSystemDir"):
            job_post["archiveSystemDir"] = (
                f"{username}/tapis-jobs-archive/${{JobCreateDate}}/${{JobName}}-${{JobUUID}}"
            )

        # Check for and set license environment variable if app requires one
        lic_type = body.get("licenseType")
        if lic_type:
            lic = _get_user_app_license(lic_type, request.user)
            if lic is None:
                raise ApiException(
                    "You are missing the required license for this application."
                )

            # TODOv3: Multistring licenses break environment variables. Determine how to handle multistring licenses, if needed at all.
            # https://jira.tacc.utexas.edu/browse/WP-70
            # license_var = {
            #     "key": "_license",
            #     "value": lic.license_as_str()
            # }
            # job_post['parameterSet']['envVariables'] = job_post['parameterSet'].get('envVariables', []) + [license_var]

        # Test file listing on relevant systems to determine whether keys need to be pushed manually
        for system_id in list(
            set([job_post["archiveSystemId"], job_post["execSystemId"]])
        ):
            system_needs_keys = test_system_needs_keys(tapis, username, system_id)
            if system_needs_keys:
                logger.info(
                    f"Keys for user {username} must be manually pushed to system: {system_needs_keys.id}"
                )
                return {"execSys": system_needs_keys}

        if settings.DEBUG:
            parsed_url = urlparse(settings.NGROK_DOMAIN)
            if not parsed_url.scheme:
                webhook_base_url = f"https://{settings.NGROK_DOMAIN}"
            else:
                webhook_base_url = settings.NGROK_DOMAIN

            interactive_wh_url = webhook_base_url + reverse(
                "webhooks:interactive_wh_handler"
            )
            jobs_wh_url = webhook_base_url + reverse("webhooks:jobs_wh_handler")
        else:
            interactive_wh_url = request.build_absolute_uri(
                reverse("webhooks:interactive_wh_handler")
            )
            jobs_wh_url = request.build_absolute_uri(
                reverse("webhooks:jobs_wh_handler")
            )

        # Add portalName tag to job in order to filter jobs by portal
        job_post["tags"] = job_post.get("tags", []) + [
            f"portalName: {settings.PORTAL_NAMESPACE}"
        ]

        parameter_set = job_post.get("parameterSet", {})
        env_variables = parameter_set.get("envVariables", [])
        # Add user projects based on env var in the parameters.
        for entry in env_variables:
            if entry.get("key") == "_UserProjects":
                projects = request.user.projects.order_by("-last_updated")
                entry["value"] = " ".join(
                    f"{project.uuid},{project.value['projectId'] if project.value['projectId'] != 'None' else project.uuid}"
                    for project in projects[: settings.USER_PROJECTS_LIMIT]
                )
                job_post["parameterSet"]["envVariables"] = env_variables
                break

        # Add additional data for interactive apps
        if body.get("isInteractive"):
            # Add webhook URL environment variable for interactive apps
            job_post["parameterSet"]["envVariables"] = job_post["parameterSet"].get(
                "envVariables", []
            ) + [{"key": "_INTERACTIVE_WEBHOOK_URL", "value": interactive_wh_url}]
            job_post["tags"].append("isInteractive")

            # Make sure $HOME/.tap directory exists for user when running interactive apps on TACC HPC Systems
            exec_system_id = job_post["execSystemId"]
            system = next(
                (v for k, v in TACC_EXEC_SYSTEMS.items() if exec_system_id.endswith(k)),
                None,
            )
            tasdir = get_user_data(username)["homeDirectory"]
            if system:
                tapis.files.mkdir(
                    systemId=exec_system_id,
                    path=f"{system['home_dir'].format(tasdir)}/.tap",
                    headers={
                        "X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"
                    },
                )
            job_post["parameterSet"]["envVariables"].append(
                {"key": "_TAS_DIR", "value": tasdir}
            )

        # Add webhook subscription for job status updates
        job_post["subscriptions"] = job_post.get("subscriptions", []) + [
            {
                "description": "Portal job status notification",
                "enabled": True,
                "eventCategoryFilter": "JOB_NEW_STATUS",
                "ttlMinutes": 0,  # ttlMinutes of 0 corresponds to max default (1 week)
                "deliveryTargets": [
                    {"deliveryMethod": "WEBHOOK", "deliveryAddress": jobs_wh_url}
                ],
            }
        ]

        logger.info(f"user: {username} is submitting job: {job_post}")
        response = tapis.jobs.submitJob(
            **job_post,
            headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"},
        )

        return response

    def post(self, request, *args, **kwargs):
        """Handles post requests for Jobs API"""

        tapis = request.user.tapis_oauth.client
        username = request.user.username
        body = json.loads(request.body)
        operation = body.get("operation")

        allowed_actions = ["resubmitJob", "cancelJob", "submitJob"]
        if operation not in allowed_actions:
            raise ApiException(
                f"user: {username} is trying to run an unsupported job operation: {operation}",
                status=400,
            )

        if operation != "submitJob":
            job_uuid = body.get("uuid")
            if job_uuid is None:
                raise ApiException(
                    f"user: {username} is trying to run job operation: {operation} with no job uuid",
                    status=400,
                )
            tapis_operation = getattr(tapis.jobs, operation)
            response = tapis_operation(
                jobUuid=job_uuid,
                headers={
                    "X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"
                },
            )

        else:
            response = self._submit_job(request, body, tapis, username)

        if isinstance(response, TapisResult):
            metrics_info = {
                "body": body,
            }
            response_uuid = response.get("uuid", None)
            if response_uuid:
                metrics_info["response_uuid"] = response_uuid
            METRICS.info(
                "Jobs",
                extra={
                    "user": username,
                    "sessionId": getattr(request.session, "session_key", ""),
                    "operation": operation,
                    "agent": request.META.get("HTTP_USER_AGENT"),
                    "ip": get_client_ip(request),
                    "info": metrics_info,
                },
            )

        return JsonResponse(
            {
                "status": 200,
                "response": response,
            },
            encoder=BaseTapisResultSerializer,
        )


class AllocationsView(AuthenticatedApiView):
    """Allocations API View"""

    def get(self, request):
        """Returns active user allocations on TACC resources

        : returns: {'response': {'active': allocations, 'portal_alloc': settings.PORTAL_ALLOCATION, 'inactive': inactive, 'hosts': hosts}}
        : rtype: dict
        """
        data = get_allocations(request.user)
        # Exclude allocation based on allocation setting list.
        for host, allocations in data["hosts"].items():
            data["hosts"][host] = [
                allocation
                for allocation in allocations
                if allocation not in settings.ALLOCATIONS_TO_EXCLUDE
            ]

        return JsonResponse(
            {
                "status": 200,
                "response": data,
            }
        )


class UserFavoriteList(LoginRequiredMixin, View):
    def get(self, request):
        favorites = UserFavorite.objects.filter(user=request.user)
        data = [
            {"id": fav.id, "tool_id": fav.tool_id, "added_on": fav.added_on.isoformat()}
            for fav in favorites
        ]
        return JsonResponse(data, safe=False)


class AddFavoriteTool(LoginRequiredMixin, View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            tool_id = data.get("tool_id")
            if not tool_id:
                return HttpResponseBadRequest("Missing tool_id")
            favorite, created = UserFavorite.objects.get_or_create(
                user=request.user, tool_id=tool_id
            )
            return JsonResponse({"success": True, "created": created})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})


class RemoveFavoriteTool(LoginRequiredMixin, View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            tool_id = data.get("tool_id")
            if not tool_id:
                return HttpResponseBadRequest("Missing tool_id")
            UserFavorite.objects.filter(user=request.user, tool_id=tool_id).delete()
            return JsonResponse({"success": True})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
