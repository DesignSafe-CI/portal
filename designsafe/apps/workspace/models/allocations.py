from django.db import models
from django.contrib.auth.models import User

class UserAllocations(models.Model):
    """
    Elasticsearch document representing cached allocations. Thin wrapper around
    `elasticsearch_dsl.Document`.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    value = models.JSONField()

    '''@classmethod
    def from_username(cls, username):
        """
        Fetches cached allocations for a user.

        Parameters
        ----------
        username: str
            TACC username to fetch allocations for.
        Returns
        -------
        UserAllocations

        Raises
        ------
        elasticsearch.exceptions.NotFoundError
        """
        es_client = new_es_client()
        uuid = get_sha256_hash(username)
        return cls.get(uuid, using=es_client)

    class Index:
        name = settings.ES_INDEX_PREFIX.format('allocations')
    '''