from django.core.serializers.json import DjangoJSONEncoder
from . import BaseAgaveResource
import logging

logger = logging.getLogger(__name__)


class AgaveJSONEncoder(DjangoJSONEncoder):

    def default(self, o):
        if isinstance(o, BaseAgaveResource):
            return o.as_json()

        return super(AgaveJSONEncoder, self).default(o)
