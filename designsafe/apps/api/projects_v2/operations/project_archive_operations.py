"""
Utility to create a ZIP archive of a publication and its metadata.
"""

import json
import logging
import os

import requests
from celery import shared_task
from django.conf import settings
from requests.auth import HTTPBasicAuth

from designsafe.apps.api.publications_v2.models import Publication
from designsafe.libs.common.context_managers import AsyncTaskContext

logger = logging.getLogger(__name__)


def create_metadata_file(project_id: str, *args, **kwargs):
    """Archive Published Files and Metadata

    When given a project_id, this function will copy and compress all of the published files
    for a project, and it will also include a formatted json document of the published metadata.
    Note: This metadata file is will only be used until the Fedora system is set up again.
    """

    metadata_name = f"{project_id}_metadata.json"
    pub_dir = f"{settings.DESIGNSAFE_PUBLISHED_PATH}/{settings.PUBLISHED_DATASET_PATH.lstrip('/')}/{project_id}"
    metadata_path = os.path.join(pub_dir, metadata_name)

    # create formatted metadata for user download
    def create_metadata():
        pub_meta = Publication.objects.get(project_id=project_id)
        meta_dict = pub_meta.tree
        try:
            with open(metadata_path, "w", encoding="utf-8") as meta_file:
                json.dump(meta_dict, meta_file)
        except OSError:
            logger.exception("Failed to create metadata!")

    create_metadata()


def ranch_archive_webhook(project_id: str):
    """Submit a webhook request to Jenkisn to trigger archiving of a publication to Ranch."""
    auth = HTTPBasicAuth(settings.JENKINS_WH_USER, settings.JENKINS_WH_TOKEN)
    req = requests.post(
        settings.JENKINS_ARCHIVE_WH_URL,
        auth=auth,
        params={"PROJECT_ID": project_id},
        timeout=30,
    )
    req.raise_for_status()


@shared_task
def archive_publication_async(project_id: str, version: str | None = 1):
    """async wrapper around archive"""
    with AsyncTaskContext():
        create_metadata_file(project_id, version)
