"""Utilities to convert published entitities to a consistent schema."""
from pathlib import Path
from typing import TypedDict
from django.conf import settings
from designsafe.apps.projects_v2.schema_models import SCHEMA_MAPPING


def convert_v1_user(user):
    """Convert legacy user representation to the V2 schema."""
    if not isinstance(user, dict):
        user = user.to_dict()
    return {
        "fname": user["first_name"],
        "lname": user["last_name"],
        "name": user["username"],
        "username": user["username"],
        "email": user["email"],
        "inst": user["profile"]["institution"],
        "order": user["_ui"]["order"],
        "guest": False,
        "authorship": True,
    }


def get_v1_authors(entity: dict, pub_users: list[dict]):
    """Convert V1 publication authors to a standard format."""
    authors = entity["value"].get("authors", [])
    updated_authors = []
    for username in authors:
        author_data = next(
            (user for user in pub_users if user["username"] == username), None
        )
        if not author_data:
            continue
        updated_authors.append(convert_v1_user(author_data))
    return updated_authors


class FileTagDict(TypedDict):
    """{"tagName": str, "fileUuid": str, "path": str}"""

    tagName: str
    fileUuid: str
    path: str


def convert_legacy_tags(entity: dict) -> list[FileTagDict]:
    """For V1 pubs, file tags are stored in a convoluted way."""
    reconstructed_tags = []

    tags = entity["value"]["tags"]
    tag_options = entity.get("tagsAsOptions", [])
    file_objs = entity.get("fileObjs", [])
    association_hrefs = entity["_links"]["associationIds"]

    def get_file_obj_by_uuid(uuid):
        association = next(
            (assoc for assoc in association_hrefs if assoc["rel"] == uuid), None
        )
        if not association:
            return None
        file_obj = next(
            (
                file_obj
                for file_obj in file_objs
                if association["href"].endswith(file_obj["path"])
            ),
            None,
        )
        return file_obj

    for inner_dict in tags.values():
        for key in inner_dict.keys():
            tag_name = next(
                (tag["label"] for tag in tag_options if tag["name"] == key), None
            )
            if not tag_name:
                continue
            for tag in inner_dict[key]:
                for file_uuid in tag["file"]:
                    file_obj = get_file_obj_by_uuid(file_uuid)
                    if not file_obj:
                        continue
                    reconstructed_tags.append(
                        {
                            "tagName": tag_name,
                            "fileUuid": file_uuid,
                            "path": file_obj["path"],
                        }
                    )
    return reconstructed_tags


def update_file_tag_paths(entity: dict, base_path: str) -> list[FileTagDict]:
    """
    Updates tag paths to reflect what the paths should be in the published dataset.
    e.g. if file "/data/xyz" is going to move to "/PRJ-1234/entity1/xyz"
    then all tags with "/data/xyz" as a path prefix should have it updated to the final
    path.

    Before: [...{"pathName": "/data/xyz/taggedFile.json}, "tagName": "Record"}]
    After: [...{"pathName": "/PRJ-1234/entity1/xyz/taggedFile.json}, "tagName": "Record"}]
    """
    tags = entity["value"].get("fileTags", None)
    if not tags:
        tags = convert_legacy_tags(entity)

    updated_tags = []
    is_type_other = entity["value"].get("projectType", None) == "other"
    if is_type_other:
        # type Other is a special case since all files are associated at the root.
        path_mapping = {"": base_path}
    else:
        path_mapping = {
            file_obj["path"]: str(Path(base_path) / Path(file_obj["path"]).name)
            for file_obj in entity["fileObjs"]
        }

    for tag in tags:
        if not tag.get("path", None):
            # If there is no path, we can't recover the tag.
            continue
        tag_path_prefixes = [p for p in path_mapping if tag["path"].startswith(p)]

        for prefix in tag_path_prefixes:
            updated_tags.append(
                {**tag, "path": tag["path"].replace(prefix, path_mapping[prefix], 1)}
            )

    return updated_tags


def update_file_objs(entity: dict, base_path: str):
    """Return an updated file_objs array relative to a new base path."""
    file_objs = entity["value"]["fileObjs"]
    updated_file_objs = []
    for file_obj in file_objs:
        new_path = Path(base_path) / Path(file_obj["path"]).name
        updated_file_objs.append({**file_obj, "path": str(new_path)})
    return updated_file_objs


def transform_entity(entity: dict, base_pub_meta: dict, base_path: str):
    """Convert published entity to use our Pydantic schema. Returns a serialized
    reprsentation of the `value` attribute."""
    model = SCHEMA_MAPPING[entity["name"]]
    authors = entity["value"].get("authors", None)
    schema_version = base_pub_meta.get("version", 1)
    if authors and schema_version == 1:
        updated_authors = get_v1_authors(entity, base_pub_meta["users"])
        entity["value"]["authors"] = updated_authors

    old_tags = entity["value"].get("tags", None)
    if old_tags:
        new_style_tags = convert_legacy_tags(entity)
        entity["value"]["fileTags"] = new_style_tags

    if entity["value"].get("fileTags", False):
        entity["value"]["fileTags"] = update_file_tag_paths(entity, base_path)

    file_objs = entity.get("fileObjs", None)
    # Some legacy experiment/hybrid sim entities have file_objs incorrectly
    # populated from their children. In these cases, _filepaths is empty.
    if file_objs and entity.get("_filePaths", None) != []:
        for file in file_objs:
            file["system"] = settings.PUBLISHED_SYSTEM
        entity["value"]["fileObjs"] = file_objs
        entity["value"]["fileObjs"] = update_file_objs(entity, base_path)

    validated_model = model.model_validate(entity["value"])
    return validated_model.model_dump()
