from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin
from designsafe.apps.api.exceptions import ApiException
import logging
import json

logger = logging.getLogger(__name__)


class IndexView(BaseApiView, SecureMixin):

    def get(self, request, *args, **kwargs):
        """
        Returns a list of Projects for the current user.
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        return JsonResponse


class InstanceView(BaseApiView):
    pass
