"""Utilities to convert published entitities to a consistent schema."""
from pathlib import Path
from typing import TypedDict


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
    }


class FileTag(TypedDict):
    """model file tags in publications we want to convert."""

    tagName: str
    fileUuid: str
    path: str


def convert_legacy_tags(entity) -> list[FileTag]:
    """For V1 pubs, file tags are stored in a convoluted way."""
    reconstructed_tags = []

    tags = entity["value"]["tags"]
    tag_options = entity["tagsAsOptions"]
    file_objs = entity["fileObjs"]
    association_hrefs = entity["_links"]["associationIds"]

    def get_file_obj_by_uuid(uuid):
        association = next(
            (assoc for assoc in association_hrefs if assoc["rel"] == uuid), None
        )
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
            tag_name = next(tag["label"] for tag in tag_options if tag["name"] == key)
            for tag in inner_dict[key]:
                for file_uuid in tag["file"]:
                    file_obj = get_file_obj_by_uuid(file_uuid)
                    reconstructed_tags.append(
                        {
                            "tagName": tag_name,
                            "fileUuid": file_uuid,
                            "path": file_obj["path"],
                        }
                    )
    return reconstructed_tags


def update_file_tag_paths(entity, base_path) -> list[FileTag]:
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

    pub_mapping = {}
    file_objs = entity["fileObjs"]
    for file_obj in file_objs:
        fo_filename = Path(file_obj["path"]).name
        pub_mapping[file_obj["path"]] = str(Path(base_path) / fo_filename)

    for tag in tags:
        tag_path_prefixes = [p for p in pub_mapping if tag["path"].startswith(p)]

        for prefix in tag_path_prefixes:
            updated_tags.append(
                {**tag, "path": tag["path"].replace(prefix, pub_mapping[prefix])}
            )

    return updated_tags
