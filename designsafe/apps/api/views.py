import json
import logging
from logging import getLevelName

import requests
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View
from requests.exceptions import HTTPError
from tapipy.errors import BaseTapyException

from designsafe.apps.api.decorators import tapis_jwt_login

from .exceptions import ApiException

logger = logging.getLogger(__name__)


class BaseApiView(View):
    """Base api view to centralize error logging."""

    def dispatch(self, request, *args, **kwargs):
        """
        Dispatch override to centralize error handling.
        If the error is instance of :class: `ApiException <designsafe.apps.api.exceptions.ApiException>`.
        An extra dictionary object will be used when calling `logger.error()`.
        This allows to use any information in the `extra` dictionary object on the
        logger output.
        """
        try:
            return super().dispatch(request, *args, **kwargs)
        except (PermissionDenied, Http404):
            # log information but re-raise exception to let django handle response
            logger.exception("")
            raise
        except ApiException as e:
            status = e.response.status_code or 400
            message = e.response.reason
            extra = e.extra
            if status != 404:
                logger.exception(
                    "%s: %s", message, e.response.text, extra=extra
                )
            else:
                logger.info("Error %s", message, exc_info=True, extra=extra)
            return JsonResponse({"message": message}, status=status)
        except (ConnectionError, HTTPError, BaseTapyException) as e:
            # status code and json content from ConnectionError/HTTPError exceptions
            # are used in the returned response. Note: the handling of these two exceptions
            # is significant as client-side code make use of these status codes (e.g. error
            # responses from tapis are used to determine a tapis storage systems does not exist)
            status = 500
            if e.response is not None:
                status = e.response.status_code
                try:
                    content = e.response.json()
                    message = content.get("message", "Unknown Error")
                except ValueError:
                    message = "Unknown Error"
                if status in [404, 403]:
                    logger.warning(
                        "%s: %s",
                        message,
                        e.response.text,
                        exc_info=True,
                        extra={
                            "username": request.user.username,
                            "session_key": request.session.session_key,
                        },
                    )
                else:
                    logger.exception(
                        "%s: %s",
                        message,
                        e.response.text,
                        extra={
                            "username": request.user.username,
                            "session_key": request.session.session_key,
                        },
                    )
            else:
                logger.exception(
                    extra={
                        "username": request.user.username,
                        "session_key": request.session.session_key,
                    },
                )
                message = str(e)
            return JsonResponse({"message": message}, status=status)
        except Exception:  # pylint: disable=broad-except
            logger.exception("")
            return JsonResponse({"message": "Something went wrong here..."}, status=500)


class AuthenticatedApiView(BaseApiView):
    """
    Extends BaseApiView to require authenticated requests
    """

    def dispatch(self, request, *args, **kwargs):
        """Returns 401 if user is not authenticated."""

        if not request.user.is_authenticated:
            return JsonResponse({"message": "Unauthenticated user"}, status=401)
        return super().dispatch(request, *args, **kwargs)


class AuthenticatedAllowJwtApiView(AuthenticatedApiView):
    """
    Extends AuthenticatedApiView to also allow JWT access in addition to django session cookie
    """

    @method_decorator(csrf_exempt, name="dispatch")
    @method_decorator(tapis_jwt_login)
    def dispatch(self, request, *args, **kwargs):
        """Returns 401 if user is not authenticated like AuthenticatedApiView but allows JWT access."""
        return super().dispatch(
            request, *args, **kwargs
        )


class LoggerApi(BaseApiView):
    """
    Logger API for capturing logs from the front-end.

    @see ng-designsafe/services/logging-service.js
    """

    def post(self, request):
        """
        Accepts a log message from the front end. Attempts to determine the level at
        which the message should be logged, and the name of the front-end logger. It
        then logs the message JSON as appropriate.

        Args:
            request: {django.http.HttpRequest} the HTTP request

        Returns: HTTP 202

        """
        log_json = request.body.decode("utf-8")
        log_data = json.loads(log_json)
        level = getLevelName(log_data.pop("level", "INFO"))
        name = log_data.pop("name")

        logger.log(
            level,
            "%s: %s",
            name,
            json.dumps(log_data),
            extra={
                "user": request.user.username,
                "referer": request.META.get("HTTP_REFERER"),
            },
        )
        return HttpResponse("OK", status=202)
    


class SystemQueueProxyApi(BaseApiView):
    """"
    Proxy API for fetching system queue data from TAP. 
    """

    def get(self, request, hostname):
        url = f"{settings.TAP_API_STATUS}/{hostname}"
        
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return JsonResponse({
                "response": response.json(),
                "status": "success"
            })
        except requests.exceptions.RequestException as e:
            logger.exception("Proxy API Error") 
            return JsonResponse({
                "response": None,
                "status": "error",
                "error": str(e)
            }, status=500)

            

class SystemOverviewProxyApi(BaseApiView):
    """
    Proxy API for fetching system monitor overview data from TAP. (Load%, Running, Waiting Jobs)
    """
    def get(self, request):
        url = settings.TAP_API_STATUS

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return JsonResponse({
                "response": response.json(),
                "status": "success"
            }, status=200)
             
        except requests.exceptions.RequestException as e:
            logger.exception("Proxy API Error") 
            return JsonResponse({
                "response": None,
                "status": "error",
                "error": str(e)
            }, status=500)
        

