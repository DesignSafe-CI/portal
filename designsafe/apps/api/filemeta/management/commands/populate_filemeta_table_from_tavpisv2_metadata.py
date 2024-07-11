"""Populate filemeta table from tapisv2-based file metadata

This module contains a Django management command which populates filemeta table
"""

# pylint: disable=logging-fstring-interpolation
# pylint: disable=no-member
import os
import logging
import json

from django.core.management.base import BaseCommand

from designsafe.apps.api.filemeta.models import FileMetaModel

try:
    from designsafe.apps.api.agave import get_service_account_client_v2
except ImportError:
    # TODOV3 drop this
    from designsafe.apps.api.agave import (
        get_service_account_client as get_service_account_client_v2,
    )


logger = logging.getLogger(__name__)


def get_all_v2_file_meta():
    """
    Return all metadata objects for files
    """
    service_account_v2 = get_service_account_client_v2()

    # query is checking if we have a system/path in the value
    # and name '"designsafe.file"
    query = {
        "name": "designsafe.file",
        "value.system": {"$exists": True},
        "value.path": {"$exists": True},
    }

    all_results = []
    offset = 0

    while True:
        limit = 300
        result = service_account_v2.meta.listMetadata(
            q=json.dumps(query), limit=limit, offset=offset
        )
        all_results = all_results + result
        offset += limit
        if len(result) != limit:
            break

    return all_results


def populate_filemeta_table(dry_run, do_not_update_existing):
    """
    Update the filemeta table from Tapisv2-based metadata.
    """
    logger.info(
        f"Updating filemeta table from tapisv2-based metadata."
        f" dry_run={dry_run} do_not_update_existing={do_not_update_existing}"
    )

    v2_file_meta_data = get_all_v2_file_meta()
    logger.info(f"Processing {len(v2_file_meta_data)} tapisv2-based metadata entries")

    updated = 0
    already_exists = 0
    for meta_data in v2_file_meta_data:
        if do_not_update_existing:
            exists = True
            try:
                FileMetaModel.get_by_path_and_system(
                    meta_data["value"]["system"], meta_data["value"]["path"]
                )
            except FileMetaModel.DoesNotExist:
                exists = False
            if exists:
                already_exists += 1
                continue

        if not dry_run:
            meta_data["value"]["path"] = (
                f"/{meta_data['value']['path'].lstrip('/')}".replace("//", "/")
            )
            meta_data["value"]["basePath"] = os.path.dirname(meta_data["value"]["path"])
            FileMetaModel.create_or_update_file_meta(meta_data["value"])
            updated += 1

    logger.info(
        "Successfully updated filemeta table from tapisv2-based metadata"
        f"\n  {len(v2_file_meta_data)} tapisv2-based metadata entries."
        f"\n  {already_exists} entries already existed in filemeta table."
        f"\n  {updated} entries were updated/created in filemeta table"
    )


class Command(BaseCommand):
    """Command for migrating projects from Tapis v2 to v3"""

    help = "Populate filemeta table from tapisv2-based file metadata."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Executes the command in a simulation mode, logging actions "
            "without applying any changes to filemeta table.",
        )

        parser.add_argument(
            "--do-not-update-existing",
            action="store_true",
            help="Allows the command to not update any rows that already exist in the filemeta table",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        do_not_update_existing = options["do_not_update_existing"]

        populate_filemeta_table(dry_run, do_not_update_existing)
