from elasticsearch_dsl import DocType, Date, String, Float
from designsafe.connections import connections

class DesignsafeUser(DocType):
    """
    DS_User is for storing info on the users that needs
    to be cached, such as their current total storage.
    """

    class Meta:
        index = 'test'

    username = String()
    last_updated = Date()
    total_storage_bytes = Float()
