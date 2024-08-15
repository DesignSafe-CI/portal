"""
Utility to create a ZIP archive of a publication and its metadata.
"""

import os
import json
import logging
import zipfile
from typing import Optional
from django.conf import settings
from designsafe.apps.api.publications_v2.models import Publication

logger = logging.getLogger(__name__)


def archive(project_id: str, version: Optional[int] = None):
    """Archive Published Files and Metadata

    When given a project_id, this function will copy and compress all of the published files
    for a project, and it will also include a formatted json document of the published metadata.
    Note: This metadata file is will only be used until the Fedora system is set up again.
    """

    if version and version > 1:
        archive_prefix = f"{project_id}v{version}"
    else:
        archive_prefix = project_id
    archive_name = f"{archive_prefix}_archive.zip"
    metadata_name = f"{archive_prefix}_metadata.json"
    pub_dir = settings.DESIGNSAFE_PUBLISHED_PATH
    arc_dir = os.path.join(pub_dir, "archives/")
    archive_path = os.path.join(arc_dir, archive_name)
    metadata_path = os.path.join(arc_dir, metadata_name)

    def set_perms(dirname, octal, subdir=None):
        try:
            os.chmod(dirname, octal)
            if subdir:
                if not os.path.isdir(subdir):
                    raise FileNotFoundError("subdirectory does not exist!")
                for root, dirs, files in os.walk(subdir):
                    os.chmod(root, octal)
                    for child_dir in dirs:
                        os.chmod(os.path.join(root, child_dir), octal)
                    for child_file in files:
                        os.chmod(os.path.join(root, child_file), octal)
        except (OSError, FileNotFoundError):
            logger.exception("Failed to set permissions for %s", dirname)
            os.chmod(dirname, 0o555)

    # compress published files into a zip archive
    def create_archive():
        arc_source = os.path.join(pub_dir, archive_prefix)

        try:
            logger.debug("Creating archive for %s", archive_prefix)
            with zipfile.ZipFile(archive_path, mode="w", allowZip64=True) as zf_archive:
                for dirs, _, files in os.walk(arc_source):
                    for file_to_zip in files:
                        if file_to_zip == archive_name:
                            continue
                        zf_archive.write(
                            os.path.join(dirs, file_to_zip),
                            os.path.join(dirs.replace(pub_dir, ""), file_to_zip),
                        )
                zf_archive.write(metadata_path, metadata_name)
                zf_archive.close()
        except (OSError, zipfile.error):
            logger.exception("Archive creation failed for %s", arc_source)
        finally:
            set_perms(pub_dir, 0o555, arc_source)
            set_perms(arc_dir, 0o555)

    # create formatted metadata for user download
    def create_metadata():
        pub_meta = Publication.objects.get(project_id=project_id)
        meta_dict = pub_meta.tree
        try:
            with open(metadata_path, "w", encoding="utf-8") as meta_file:
                json.dump(meta_dict, meta_file)
        except OSError:
            logger.exception("Failed to create metadata!")

    set_perms(pub_dir, 0o755, os.path.join(pub_dir, archive_prefix))
    set_perms(arc_dir, 0o755)
    create_metadata()
    create_archive()
