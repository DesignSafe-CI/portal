from django.core.serializers.json import DjangoJSONEncoder
from . import BaseAgaveResource
import logging

logger = logging.getLogger(__name__)


class AgaveJSONEncoder(DjangoJSONEncoder):

    def default(self, o):
        if isinstance(o, BaseAgaveResource):
            agave_dict = o.__dict__
            agave_dict.pop('_agave')
            return agave_dict

        return super(AgaveJSONEncoder, self).default(o)
