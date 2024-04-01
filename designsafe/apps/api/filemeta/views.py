import logging
import json
from django.http import JsonResponse, HttpRequest
from designsafe.apps.api.filemeta.models import FileMetaModel
from designsafe.apps.api.views import AuthenticatedApiView
from designsafe.apps.api.exceptions import ApiException


logger = logging.getLogger(__name__)

class FileMetaView(AuthenticatedApiView):
    """View for creating and getting file metadata"""

    def get(self, request: HttpRequest, system_id:str, path: str):
        """Return metadata for system_id/path

        If no metadata for system_id and path, then empty dict is returned
        """

        result = {}
        try:
            logger.debug(f"Get file metadata. system:{system_id} path:{path}")
            file_meta = FileMetaModel.objects.get(system=system_id, path=path)
            result = file_meta.data
        except FileMetaModel.DoesNotExist:
            pass

        return JsonResponse(result,
                            safe=False)


    def post(self, request: HttpRequest, system_id:str, path: str):
        """Create metadata for system_id/path."""
        try:
            logger.info(f"Creating or updating file metadata. system:{system_id} path:{path}")
            data = json.loads(request.body)
            FileMetaModel.objects.update_or_create(
                system=system_id, path=path,
                defaults={'data': data}
            )
            return JsonResponse({"result": "OK"})
        except Exception:
            logger.exception(f"Unable to create or update file metadata: {system_id}/{path}")
            raise ApiException(
                "Unable to create or update file metadata", status=500
            )
