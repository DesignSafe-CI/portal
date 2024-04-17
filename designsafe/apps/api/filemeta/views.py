"""File Meta view"""
import logging
import json
import functools
from django.http import JsonResponse, HttpRequest
from designsafe.apps.api.datafiles.operations.agave_operations import listing
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.filemeta.models import FileMetaModel
from designsafe.apps.api.views import AuthenticatedApiView


logger = logging.getLogger(__name__)


def check_access(view_func):
    """Decorator to check if user has access to set/get metadata"""

    @functools.wraps(view_func)
    def wrapper(self, request, system_id, path, *args, **kwargs):
        try:
            # TODO_V3 update to use renamed (i.e. "tapis") client
            # TODO_V3 consider if reading is enough for metadata write access
            listing(request.user.agave_oauth.client, system_id, path)
        # pylint:disable=broad-exception-caught
        except Exception as exc:
            logger.error(
                f"user cannot access any related metadata as listing failed for {system_id}/{path} with error {str(exc)}."
            )
            return JsonResponse(
                {"message": "User forbidden to access metadata"}, status=403
            )

        return view_func(self, request, system_id, path, *args, **kwargs)

    return wrapper


class FileMetaView(AuthenticatedApiView):
    """View for creating and getting file metadata"""

    @check_access
    def get(self, request: HttpRequest, system_id: str, path: str):
        """Return metadata for system_id/path

        If no metadata for system_id and path, then empty dict is returned
        """

        result = {}
        try:
            logger.debug(f"Get file metadata. system:{system_id} path:{path}")
            file_meta = FileMetaModel.objects.get(system=system_id, path=path)
            result = {
                "value": file_meta.value,
                "lastUpdated": file_meta.last_updated,
                "name": "designsafe.file",
            }
        except FileMetaModel.DoesNotExist:
            pass

        return JsonResponse(result, safe=False)

    @check_access
    def post(self, request: HttpRequest, system_id: str, path: str):
        """Create metadata for system_id/path."""
        try:
            logger.info(
                f"Creating or updating file metadata. system:{system_id} path:{path}"
            )
            data = json.loads(request.body)
            FileMetaModel.objects.update_or_create(
                system=system_id, path=path, defaults={"value": data}
            )
            return JsonResponse({"result": "OK"})
        except Exception as exc:
            logger.exception(
                f"Unable to create or update file metadata: {system_id}/{path}"
            )
            raise ApiException(
                "Unable to create or update file metadata", status=500
            ) from exc
