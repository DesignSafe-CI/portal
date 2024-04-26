"""File Meta view"""
import logging
import json
from django.http import JsonResponse, HttpRequest
from designsafe.apps.api.datafiles.operations.tapis_operations import listing
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.filemeta.models import FileMetaModel
from designsafe.apps.api.views import AuthenticatedApiView


logger = logging.getLogger(__name__)


def check_access(request, system_id: str, path: str, check_for_writable_access=False):
    """
    Check if the user has access to a specific system and path.

    This function utilizes the listing functionality to verify access. Writable access is only given for files
    in DS project systems.

    Raises:
    - ApiException: If the user is forbidden from accessing or modifying the metadata.
    """

    if check_for_writable_access and not system_id.startswith("project-"):
        error_msg = f"Metadata updates are not allowed on non-project systems (system={system_id})."
        logger.error(error_msg)
        raise ApiException(error_msg, status=403)

    try:
        # TODO_V3 update to use renamed (i.e. "tapis") client
        listing(request.user.agave_oauth.client, system_id, path)
    except Exception as exc:  # pylint:disable=broad-exception-caught
        logger.error(
            f"user cannot access any related metadata as listing failed for {system_id}/{path} with error {str(exc)}."
        )
        raise ApiException("User forbidden to access metadata", status=403) from exc


# TODO_V3 update to allow JWT access DES-2706: https://github.com/DesignSafe-CI/portal/pull/1192
class FileMetaView(AuthenticatedApiView):
    """View for creating and getting file metadata"""

    def get(self, request: HttpRequest, system_id: str, path: str):
        """Return metadata for system_id/path

        If no metadata for system_id and path, then empty dict is returned
        """
        check_access(request, system_id, path)

        result = {}
        try:
            logger.debug(f"Get file metadata. system:{system_id} path:{path}")
            file_meta = FileMetaModel.get_by_path_and_system(
                system=system_id, path=path
            )
            result = {
                "value": file_meta.value,
                "lastUpdated": file_meta.last_updated,
                "name": "designsafe.file",
            }
        except FileMetaModel.DoesNotExist:
            pass

        return JsonResponse(result, safe=False)


# TODO_V3 update to allow JWT access DES-2706: https://github.com/DesignSafe-CI/portal/pull/1192
class CreateFileMetaView(AuthenticatedApiView):
    """View for creating (and updating) file metadata"""

    def post(self, request: HttpRequest):
        """Create metadata for system_id/path."""

        value = json.loads(request.body)
        if "system" not in value or "path" not in value:
            logger.error(
                f"Unable to create or update file metadata as system and path not in payload: {value}"
            )
            raise ApiException("System and path are required in payload", status=400)

        system_id = value["system"]
        path = value["path"]

        check_access(request, system_id, path, check_for_writable_access=True)

        try:
            logger.info(
                f"Creating or updating file metadata. system:{system_id} path:{path}"
            )

            FileMetaModel.create_or_update_file_meta(value)
            return JsonResponse({"result": "OK"})
        except Exception as exc:
            logger.exception(
                f"Unable to create or update file metadata: {system_id}/{path}"
            )
            raise ApiException(
                "Unable to create or update file metadata", status=500
            ) from exc
