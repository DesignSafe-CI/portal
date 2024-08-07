"""Async tasks related to published work"""
from celery import shared_task
from designsafe.apps.api.publications_v2.operations.fedora_graph_operations import (
    ingest_pub_fedora,
)


@shared_task()
def ingest_pub_fedora_async(project_id: str, version: int = 1, amend: bool = False):
    """async wrapper around Fedora ingest"""
    ingest_pub_fedora(project_id, version, amend)
