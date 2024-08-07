"""Utils for bulk move/copy of file metadata objects."""

import os
from celery import shared_task
from designsafe.apps.api.filemeta.models import FileMetaModel


def copy_file_meta(src_system: str, src_path: str, dest_system: str, dest_path: str):
    """Create new copies of file metadata when files are copied to a new system/path."""
    clean_src_path = f"/{src_path.lstrip('/').replace('//', '/')}"
    clean_dest_path = f"/{dest_path.lstrip('/').replace('//', '/')}"
    meta_objs_to_create = (
        FileMetaModel(
            value={
                **meta_obj.value,
                "system": dest_system,
                "path": meta_obj.value["path"].replace(clean_src_path, clean_dest_path),
                "basePath": os.path.dirname(
                    meta_obj.value["path"].replace(clean_src_path, clean_dest_path)
                ),
            }
        )
        for meta_obj in FileMetaModel.objects.filter(
            value__system=src_system,
            value__path__startswith=f"/{src_path.lstrip('/').replace('//', '/')}",
        )
    )
    # return meta_objs_to_create
    FileMetaModel.objects.bulk_create(meta_objs_to_create)


@shared_task
def copy_file_meta_async(
    src_system: str, src_path: str, dest_system: str, dest_path: str
):
    """async wrapper around copy_file_meta"""
    copy_file_meta(src_system, src_path, dest_system, dest_path)


def move_file_meta(src_system: str, src_path: str, dest_system: str, dest_path: str):
    """Update system and path of metadata objects to reflect movement to a new path."""
    clean_src_path = f"/{src_path.lstrip('/').replace('//', '/')}"
    clean_dest_path = f"/{dest_path.lstrip('/').replace('//', '/')}"

    meta_to_update = list(
        FileMetaModel.objects.filter(
            value__system=src_system,
            value__path__startswith=f"/{src_path.lstrip('/').replace('//', '/')}",
        )
    )

    for meta_obj in meta_to_update:
        meta_obj.value = {
            **meta_obj.value,
            "system": dest_system,
            "path": meta_obj.value["path"].replace(clean_src_path, clean_dest_path),
            "basePath": os.path.dirname(
                meta_obj.value["path"].replace(clean_src_path, clean_dest_path)
            ),
        }

    FileMetaModel.objects.bulk_update(meta_to_update, ["value"])


@shared_task
def move_file_meta_async(
    src_system: str, src_path: str, dest_system: str, dest_path: str
):
    """Async wrapper around move_file_meta"""
    move_file_meta(src_system, src_path, dest_system, dest_path)
