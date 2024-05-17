from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View
from django.http import JsonResponse, HttpResponse, Http404
from django.core.exceptions import PermissionDenied
from django.utils.decorators import method_decorator
from requests.exceptions import HTTPError
from .exceptions import ApiException
import logging
from logging import getLevelName
import json
from designsafe.apps.api.decorators import tapis_jwt_login
from tapipy.errors import BaseTapyException

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
        except (PermissionDenied, Http404) as e:
            # log information but re-raise exception to let django handle response
            logger.error(e, exc_info=True)
            raise e
        except ApiException as e:
            status = e.response.status_code
            message = e.response.reason
            extra = e.extra
            if status != 404:
                logger.error(
                    "%s: %s", message, e.response.text, exc_info=True, extra=extra
                )
            else:
                logger.info("Error %s", message, exc_info=True, extra=extra)
            return JsonResponse({"message": message}, status=400)
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
                    logger.error(
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
                logger.error(
                    e,
                    exc_info=True,
                    extra={
                        "username": request.user.username,
                        "session_key": request.session.session_key,
                    },
                )
                message = str(e)
            return JsonResponse({"message": message}, status=status)
        except Exception as e:  # pylint: disable=broad-except
            logger.error(e, exc_info=True)
            return JsonResponse({"message": "Something went wrong here..."}, status=500)


class AuthenticatedApiView(BaseApiView):
    """
    Extends BaseApiView to require authenticated requests
    """

    def dispatch(self, request, *args, **kwargs):
        """Returns 401 if user is not authenticated."""

        if not request.user.is_authenticated:
            return JsonResponse({"message": "Unauthenticated user"}, status=401)
        return super(AuthenticatedApiView, self).dispatch(request, *args, **kwargs)


class AuthenticatedAllowJwtApiView(AuthenticatedApiView):
    """
    Extends AuthenticatedApiView to also allow JWT access in addition to django session cookie
    """

    @method_decorator(csrf_exempt, name="dispatch")
    @method_decorator(tapis_jwt_login)
    def dispatch(self, request, *args, **kwargs):
        """Returns 401 if user is not authenticated like AuthenticatedApiView but allows JWT access."""
        return super(AuthenticatedAllowJwtApiView, self).dispatch(
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
