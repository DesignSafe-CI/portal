"""Elasticsearch model for published works"""

from elasticsearch_dsl import Document
from elasticsearch.exceptions import NotFoundError
import networkx as nx
from django.conf import settings
from designsafe.apps.api.projects_v2.models import ProjectMetadata
from designsafe.apps.api.projects_v2.operations.project_publish_operations import (
    add_values_to_tree,
)


class IndexedProject(Document):
    """Elasticsearch model for published works"""

    # pylint: disable=too-few-public-methods
    class Index:
        """Index meta settings"""

        name = settings.ES_INDICES["projects_v2"]["alias"]


def index_project(project_id):
    """Util to index a project by its project ID"""
    project_meta = ProjectMetadata.get_project_by_id(project_id)
    project_tree = add_values_to_tree(project_id)
    project_json = nx.node_link_data(project_tree)
    try:
        pub_es = IndexedProject.get(project_id)
        pub_es.update(**project_json, uuid=project_meta.uuid, value=project_meta.value)

    except NotFoundError:
        pub_es = IndexedProject(
            **project_json, uuid=project_meta.uuid, value=project_meta.value
        )
        pub_es.meta["id"] = project_id
        pub_es.save()


def reindex_projects():
    """Reindex all projects"""
    for prj in ProjectMetadata.objects.filter(name="designsafe.project"):
        index_project(prj.project_id)
