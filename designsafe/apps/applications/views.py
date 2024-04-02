# from agavepy.agave import Agave, AgaveException, load_resource
from designsafe.apps.licenses.models import LICENSE_TYPES, get_license_info
from designsafe.apps.notifications.views import get_number_unread_notifications
from designsafe.libs.common.decorators import profile as profile_fn
from designsafe.apps.api.tasks import index_or_update_project
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse
from django.shortcuts import render, redirect
from requests import HTTPError
from designsafe.apps.api.utils import get_client_ip
import json
import logging


logger = logging.getLogger(__name__)
metrics = logging.getLogger("metrics")

# AGAVE_RESOURCES = load_resource(getattr(settings, 'AGAVE_TENANT_BASEURL'))


@login_required
def index(request):
    context = {}
    token_key = getattr(settings, "AGAVE_TOKEN_SESSION_ID")
    if token_key in request.session:
        context["session"] = {"agave": json.dumps(request.session[token_key])}
    context["unreadNotifications"] = get_number_unread_notifications(request)
    return render(request, "designsafe/apps/applications/index.html", context)
    # if request.user.is_superuser:
    #     return render(request, 'designsafe/apps/applications/index.html', context)
    # else:
    #     return render(request, 'designsafe/apps/applications/denied.html', context)


def _app_license_type(app_id):
    app_lic_type = app_id.replace("-{}".format(app_id.split("-")[-1]), "").upper()
    lic_type = next((t for t in LICENSE_TYPES if t in app_lic_type), None)
    return lic_type


@profile_fn
def call_api(request, service):
    """Serves as agave api for apps, files, systems, meta
    :param request: http request from angular service
    :returns: JSON response for agave call
    """
    if request.user.is_authenticated:
        try:
            token = request.user.agave_oauth
            agave = Agave(
                api_server=settings.AGAVE_TENANT_BASEURL,
                token=token.access_token,
                resources=AGAVE_RESOURCES,
            )
            if service == "apps":
                appId = request.GET.get("appId")
                pems = request.GET.get("pems")

                if request.method == "GET":
                    if appId:
                        if pems:
                            metrics.info(
                                "agave.apps.listPermissions",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.apps.listPermissions",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"appId": appId},
                                },
                            )
                            data = agave.apps.listPermissions(appId=appId)
                        else:
                            metrics.info(
                                "agave.apps.get",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.apps.get",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"appId": appId},
                                },
                            )
                            data = agave.apps.get(appId=appId)
                            lic_type = _app_license_type(appId)
                            data["license"] = {"type": lic_type}
                            if lic_type is not None:
                                _, license_models = get_license_info()
                                license_model = [
                                    x
                                    for x in license_models
                                    if x.license_type == lic_type
                                ][0]
                                lic = license_model.objects.filter(
                                    user=request.user
                                ).first()
                                data["license"]["enabled"] = lic is not None
                    else:
                        metrics.info(
                            "agave.apps.list",
                            extra={
                                "agent": request.META.get("HTTP_USER_AGENT"),
                                "ip": get_client_ip(request),
                                "operation": "agave.apps.list",
                                "sessionId": getattr(
                                    request.session, "session_key", ""
                                ),
                                "user": request.user.username,
                                "info": {},
                            },
                        )
                        data = agave.apps.list(
                            search={"filter": "*", "available": True}
                        )
                elif request.method == "POST":
                    body = json.loads(request.body)
                    if appId:
                        if pems:
                            username = request.GET.get("username")
                            metrics.info(
                                "agave.apps.updatePermissionsForUser",
                                extra={
                                    "operation": "agave.apps.updatePermissionsForUser",
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"username": username},
                                },
                            )
                            data = agave.apps.updatePermissionsForUser(
                                appId=appId, username=username, body=body
                            )
                        else:
                            metrics.info(
                                "agave.apps.manage",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.apps.manage",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"appId": appId, "body": body},
                                },
                            )
                            data = agave.apps.manage(appId=appId, body=body)
                    else:
                        metrics.info(
                            "agave.apps.add",
                            extra={
                                "agent": request.META.get("HTTP_USER_AGENT"),
                                "ip": get_client_ip(request),
                                "operation": "agave.apps.add",
                                "sessionId": getattr(
                                    request.session, "session_key", ""
                                ),
                                "user": request.user.username,
                                "info": {"body": body},
                            },
                        )
                        data = agave.apps.add(body=body)
                elif request.method == "DELETE":
                    metrics.info("apps DELETE")
                    if appId:
                        if pems:
                            username = request.GET.get("username")
                            metrics.info(
                                "agave.apps.deletePermissionsForUser",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.apps.deletePermissionsForUser",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"username": username},
                                },
                            )
                            data = agave.apps.deletePermissionsForUser(
                                appId=appId, username=username
                            )
                        else:
                            metrics.info(
                                "agave.apps.delete",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.apps.delete",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"appId": appId},
                                },
                            )
                            data = agave.apps.delete(appId=appId)

            elif service == "files":
                system_id = request.GET.get("system_id")
                path = request.GET.get("path")
                metrics.info(
                    "agave.files.list",
                    extra={
                        "agent": request.META.get("HTTP_USER_AGENT"),
                        "ip": get_client_ip(request),
                        "operation": "agave.files.list",
                        "sessionId": getattr(request.session, "session_key", ""),
                        "user": request.user.username,
                        "info": {"system_id": system_id, "path": path},
                    },
                )
                if system_id and path:
                    data = agave.files.list(systemId=system_id, filePath=path)

            elif service == "systems":
                system_id = request.GET.get("system_id")
                public = request.GET.get("isPublic")
                type = request.GET.get("type")
                roles = request.GET.get("roles")
                user_role = request.GET.get("user_role")

                if request.method == "GET":
                    if system_id:
                        if roles:
                            metrics.info(
                                "agave.systems.listRoles",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.systems.listRoles",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"system_id": system_id},
                                },
                            )
                            data = agave.systems.listRoles(systemId=system_id)
                        elif user_role:
                            metrics.info(
                                "agave.systems.getRoleForUser",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.systems.getRoleForUser",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"system_id": system_id},
                                },
                            )
                            data = agave.systems.getRoleForUser(
                                systemId=system_id, username=request.user.username
                            )
                        else:
                            metrics.info(
                                "agave.systems.get",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.systems.get",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"system_id": system_id},
                                },
                            )
                            data = agave.systems.get(systemId=system_id)
                    else:
                        if public:
                            if type:
                                logger.debug("SHOULD BE HERE")

                                metrics.info(
                                    "agave.systems.list",
                                    extra={
                                        "agent": request.META.get("HTTP_USER_AGENT"),
                                        "ip": get_client_ip(request),
                                        "operation": "agave.systems.list public",
                                        "sessionId": getattr(
                                            request.session, "session_key", ""
                                        ),
                                        "user": request.user.username,
                                        "info": {"public": public, "type": type},
                                    },
                                )
                                data = agave.systems.list(public=public, type=type)
                            else:
                                metrics.info(
                                    "agave.systems.list",
                                    extra={
                                        "agent": request.META.get("HTTP_USER_AGENT"),
                                        "ip": get_client_ip(request),
                                        "operation": "agave.systems.list public",
                                        "sessionId": getattr(
                                            request.session, "session_key", ""
                                        ),
                                        "user": request.user.username,
                                        "info": {"public": public},
                                    },
                                )
                                data = agave.systems.list(public=public)
                        else:
                            if type:
                                metrics.info(
                                    "agave.systems.list",
                                    extra={
                                        "agent": request.META.get("HTTP_USER_AGENT"),
                                        "ip": get_client_ip(request),
                                        "operation": "agave.systems.list",
                                        "sessionId": getattr(
                                            request.session, "session_key", ""
                                        ),
                                        "user": request.user.username,
                                        "info": {"type": type},
                                    },
                                )
                                data = agave.systems.list(type=type)
                            else:
                                metrics.info(
                                    "agave.systems.list",
                                    extra={
                                        "agent": request.META.get("HTTP_USER_AGENT"),
                                        "ip": get_client_ip(request),
                                        "operation": "agave.systems.list",
                                        "sessionId": getattr(
                                            request.session, "session_key", ""
                                        ),
                                        "user": request.user.username,
                                        "info": {},
                                    },
                                )
                                data = agave.systems.list()

            elif service == "meta":
                uuid = request.GET.get("uuid")
                pems = request.GET.get("pems")
                query = request.GET.get("q")
                if request.method == "GET":
                    if pems:
                        if uuid:
                            metrics.info(
                                "agave.meta.listMetadataPermissions",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "user": request.user.username,
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "operation": "agave.meta.listMetadataPermissions",
                                    "info": {"uuid": uuid},
                                },
                            )
                            data = agave.meta.listMetadataPermissions(uuid=uuid)
                    else:
                        if uuid:
                            metrics.info(
                                "agave.meta.getMetadata",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.meta.getMetadata",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"uuid": uuid},
                                },
                            )
                            data = agave.meta.getMetadata(uuid=uuid)
                        elif query:
                            metrics.info(
                                "agave.meta.listMetadata",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.meta.listMetadata",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"query": query},
                                },
                            )
                            data = agave.meta.listMetadata(q=query, limit=0)
                        else:
                            metrics.info(
                                "agave.meta.listMetadata",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                },
                            )
                            data = agave.meta.listMetadata()
                elif request.method == "POST":
                    body = json.loads(request.body)
                    metrics.info(
                        "meta POST body",
                        extra={
                            "agent": request.META.get("HTTP_USER_AGENT"),
                            "ip": get_client_ip(request),
                            "operation": "agave.meta.listMetadata",
                            "sessionId": getattr(request.session, "session_key", ""),
                            "user": request.user.username,
                            "info": {"body": body},
                        },
                    )
                    if pems:
                        username = request.GET.get("username")
                        if username:
                            metrics.info(
                                "agave.meta.updateMetadataPermissionsForUser",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.meta.listMetadata",
                                    "user": request.user.username,
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "info": {"uuid": uuid, "username": username},
                                },
                            )
                            data = agave.meta.updateMetadataPermissionsForUser(
                                body=body, uuid=uuid, username=username
                            )
                        else:
                            metrics.info(
                                "agave.meta.updateMetadata",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.meta.listMetadata",
                                    "user": request.user.username,
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "info": {"uuid": uuid},
                                },
                            )
                            data = agave.meta.updateMetadata(body=body, uuid=uuid)
                            index_or_update_project.apply_async(
                                args=[uuid], queue="api"
                            )
                    else:
                        if uuid:
                            metrics.info(
                                "agave.meta.updateMetadata uuid",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.meta.listMetadata",
                                    "user": request.user.username,
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "info": {"uuid": uuid},
                                },
                            )
                            data = agave.meta.updateMetadata(uuid=uuid, body=body)
                            index_or_update_project.apply_async(
                                args=[uuid], queue="api"
                            )
                        else:
                            metrics.info(
                                "agave.meta.addMetadata",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.meta.listMetadata",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"body": body},
                                },
                            )
                            data = agave.meta.addMetadata(body=body)

                elif request.method == "DELETE":
                    if uuid:
                        if pems:
                            username = request.GET.get("username")
                            metrics.info(
                                "agave.meta.deleteMetadataPermissionsForUser",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.meta.listMetadata",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"username": username},
                                },
                            )
                            data = agave.meta.deleteMetadataPermissionsForUser(
                                uuid=uuid, username=username
                            )
                        else:
                            metrics.info(
                                "agave.meta.deleteMetadata",
                                extra={
                                    "agent": request.META.get("HTTP_USER_AGENT"),
                                    "ip": get_client_ip(request),
                                    "operation": "agave.meta.listMetadata",
                                    "sessionId": getattr(
                                        request.session, "session_key", ""
                                    ),
                                    "user": request.user.username,
                                    "info": {"uuid": uuid},
                                },
                            )
                            data = agave.meta.deleteMetadata(uuid=uuid)
            elif service == "sync":
                uuid = request.GET.get("uuid")
                pems = request.GET.get("pems")
                appId = request.GET.get("appId")
                query = request.GET.get("q")

                ds_admin_client = Agave(
                    api_server=getattr(settings, "AGAVE_TENANT_BASEURL"),
                    token=getattr(settings, "AGAVE_SUPER_TOKEN"),
                )

                if request.method == "GET":
                    if appId and pems:
                        metrics.info(
                            "ds_admin_client.apps.listPermissions",
                            extra={
                                "agent": request.META.get("HTTP_USER_AGENT"),
                                "ip": get_client_ip(request),
                                "operation": "ds_admin_client.apps.listPermissions",
                                "sessionId": getattr(
                                    request.session, "session_key", ""
                                ),
                                "user": "ds_admin",
                                "info": {"appId": appId},
                            },
                        )
                        data = ds_admin_client.apps.listPermissions(appId=appId)
                    else:
                        metrics.info(
                            "ds_admin_client.meta.listMetadata",
                            extra={
                                "agent": request.META.get("HTTP_USER_AGENT"),
                                "ip": get_client_ip(request),
                                "operation": "ds_admin_client.meta.listMetadata",
                                "sessionId": getattr(
                                    request.session, "session_key", ""
                                ),
                                "user": "ds_admin",
                                "info": {"query": query},
                            },
                        )
                        data = ds_admin_client.meta.listMetadata(q=query)

                elif request.method == "POST":
                    body = json.loads(request.body)
                    username = request.GET.get("username")
                    if pems and username:
                        metrics.info(
                            "ds_admin_client.meta.updateMetadataPermissionsForUser",
                            extra={
                                "agent": request.META.get("HTTP_USER_AGENT"),
                                "ip": get_client_ip(request),
                                "operation": "agave.meta.listMetadata",
                                "sessionId": getattr(
                                    request.session, "session_key", ""
                                ),
                                "user": "ds_admin",
                                "info": {
                                    "body": body,
                                    "uuid": uuid,
                                    "username": username,
                                },
                            },
                        )
                        data = ds_admin_client.meta.updateMetadataPermissionsForUser(
                            body=body, uuid=uuid, username=username
                        )

            else:
                return HttpResponse("Unexpected service: %s" % service, status=400)
        except AgaveException as e:
            logger.error(
                "Failed to execute {0} API call due to AgaveException={1}".format(
                    service, e
                )
            )
            return HttpResponse(
                json.dumps(e), content_type="application/json", status=400
            )
        except HTTPError as e:
            try:
                json_response = e.response.json()
                metrics.info(
                    "Failed to execute {0} API call due to HTTPError={1}".format(
                        service, json_response.get("message")
                    ),
                    extra={
                        "agent": request.META.get("HTTP_USER_AGENT"),
                        "ip": get_client_ip(request),
                        "operation": "agave.meta.listMetadata",
                        "sessionId": getattr(request.session, "session_key", ""),
                        "user": request.user.username,
                        "info": {},
                    },
                )
                logger.error(
                    "Failed to execute {0} API call due to HTTPError={1}".format(
                        service, json_response.get("message")
                    )
                )
                return HttpResponse(
                    json.dumps(json_response.get("message")),
                    content_type="application/json",
                    status=400,
                )
            except Exception as e:
                return HttpResponse(
                    json.dumps(e), content_type="application/json", status=400
                )

        except Exception as e:
            metrics.info(
                "Failed to execute {0} API call due to Exception={1}".format(
                    service, e
                ),
                extra={
                    "agent": request.META.get("HTTP_USER_AGENT"),
                    "ip": get_client_ip(request),
                    "operation": "agave.meta.listMetadata",
                    "sessionId": getattr(request.session, "session_key", ""),
                    "user": request.user.username,
                    "info": {},
                },
            )
            logger.error(
                "Failed to execute {0} API call due to Exception={1}".format(
                    service, e
                ),
                extra={
                    "agent": request.META.get("HTTP_USER_AGENT"),
                    "ip": get_client_ip(request),
                    "user": request.user.username,
                },
            )
            return HttpResponse(
                json.dumps({"status": "error", "message": "{}".format(e)}),
                content_type="application/json",
                status=400,
            )

        return HttpResponse(
            json.dumps(data, cls=DjangoJSONEncoder), content_type="application/json"
        )

    else:
        return HttpResponse(
            json.dumps(
                {"status": "error", "message": "Invalid credentials. Please login."}
            ),
            content_type="application/json",
            status=400,
        )
