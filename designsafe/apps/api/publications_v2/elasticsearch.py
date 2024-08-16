"""Elasticsearch model for published works"""

from elasticsearch_dsl import Document
from elasticsearch.exceptions import NotFoundError
from django.conf import settings
from designsafe.apps.api.publications_v2.models import Publication


class IndexedPublication(Document):
    """Elasticsearch model for published works"""

    # pylint: disable=too-few-public-methods
    class Index:
        """Index meta settings"""

        name = settings.ES_INDICES["publications_v2"]["alias"]


def index_publication(project_id):
    """Util to index a publication by its project ID"""
    pub = Publication.objects.get(project_id=project_id)
    try:
        pub_es = IndexedPublication.get(project_id)
        pub_es.update(**pub.tree)

    except NotFoundError:
        pub_es = IndexedPublication(**pub.tree)
        pub_es.meta["id"] = project_id
        pub_es.save()
