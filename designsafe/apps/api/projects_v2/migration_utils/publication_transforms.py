"""Utilities to convert published entitities to a consistent schema."""

from pathlib import Path
from typing import TypedDict
from django.conf import settings
from django.contrib.auth import get_user_model
from designsafe.apps.api.projects_v2.schema_models import SCHEMA_MAPPING

user_model = get_user_model()


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
        "role": "team_member",
    }


def get_user_info(username: str, role: str = None) -> dict:
    """Construct a user object from info in the db."""
    try:
        user_obj = user_model.objects.get(username=username)
    except user_model.DoesNotExist:
        return {
            "username": username,
            "fname": "N/A",
            "lname": "N/A",
            "email": "N/A",
            "inst": "N/A",
            "role": role,
        }
    user_info = {
        "username": username,
        "fname": user_obj.first_name,
        "lname": user_obj.last_name,
        "email": user_obj.email,
        "inst": user_obj.profile.institution,
    }
    if role:
        user_info["role"] = role
    return user_info


def construct_users(entity: dict) -> list[dict]:
    """Get users associated with an entity."""
    _users = []
    _users.append(get_user_info(entity["value"].get("pi"), role="pi"))
    for co_pi in entity["value"].get("coPis", []):
        _users.append(get_user_info(co_pi, role="co_pi"))
    for team_member in entity["value"].get("teamMembers", []):
        _users.append(get_user_info(team_member, role="team_member"))
    for guest_member in entity["value"].get("guestMembers", []):
        _users.append({**guest_member, "username": None, "role": "guest"})

    return _users


def convert_v2_user(user):
    """Convert v2 publication user to fill in all fields"""
    is_guest = user.get("guest", False)
    if is_guest:
        role = "guest"
        username = None
    else:
        role = "team_member"
        username = user["name"]

    return {
        "fname": user["fname"],
        "lname": user["lname"],
        "name": user["name"],
        "username": username,
        "role": role,
        "guest": is_guest,
        "order": user["order"],
        "email": user.get("email", None),
        "inst": user.get("inst", None),
        "authorship": user["authorship"],
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
    path_mapping = get_path_mapping(entity, base_path)

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


def get_path_mapping(entity: dict, base_path: str):
    """map fileObj paths to published paths and handle duplicate names"""
    file_objs = entity["value"]["fileObjs"]
    is_type_other = entity["value"].get("projectType", None) == "other"

    if is_type_other:
        # type Other is a special case since all files are associated at the root.
        return {"": base_path}
    path_mapping = {}
    duplicate_counts = {}
    for file_obj in file_objs:
        pub_path = str(Path(base_path) / Path(file_obj["path"]).name)
        if pub_path in path_mapping.values():
            duplicate_counts[pub_path] = duplicate_counts.get(pub_path, 0) + 1
            # splice dupe count into name, e.g. "myfile(1).txt"
            [base_name, *ext] = Path(pub_path).name.split(".", 1)
            deduped_name = f"{base_name}({duplicate_counts[pub_path]})"

            pub_path = str(Path(base_path) / ".".join([deduped_name, *ext]))
        path_mapping[file_obj["path"]] = pub_path

    return path_mapping


def update_file_objs(
    entity: dict, base_path: str, system_id="designsafe.storage.published"
):
    """Return an updated file_objs array relative to a new base path."""
    file_objs = entity["value"]["fileObjs"]
    path_mapping = get_path_mapping(entity, base_path)
    updated_file_objs = []
    for file_obj in file_objs:
        updated_file_objs.append(
            {**file_obj, "path": path_mapping[file_obj["path"]], "system": system_id}
        )
    return updated_file_objs, path_mapping


def transform_entity(entity: dict, base_pub_meta: dict, base_path: str):
    """Convert published entity to use our Pydantic schema. Returns a serialized
    reprsentation of the `value` attribute."""
    model = SCHEMA_MAPPING[entity["name"]]
    authors = entity["value"].get("authors", None)
    schema_version = base_pub_meta.get("version", 1)
    if authors and schema_version == 1:
        updated_authors = get_v1_authors(entity, base_pub_meta["users"])
        entity["value"]["authors"] = updated_authors
    if authors and schema_version > 1:
        fixed_authors = list(map(convert_v2_user, entity["authors"]))
        entity["value"]["authors"] = sorted(fixed_authors, key=lambda a: a["order"])

    old_tags = entity["value"].get("tags", None)
    if old_tags:
        new_style_tags = convert_legacy_tags(entity)
        entity["value"]["fileTags"] = new_style_tags

    file_objs = entity.get("fileObjs", None)
    # Some legacy experiment/hybrid sim entities have file_objs incorrectly
    # populated from their children. In these cases, _filepaths is empty.
    if file_objs and entity.get("_filePaths", None) != []:
        entity["value"]["fileObjs"] = file_objs
        if entity["value"].get("fileTags", False):
            entity["value"]["fileTags"] = update_file_tag_paths(entity, base_path)
        new_file_objs, path_mapping = update_file_objs(
            entity, base_path, system_id=settings.PUBLISHED_SYSTEM
        )

        entity["value"]["fileObjs"] = new_file_objs
    else:
        path_mapping = {}

    validated_model = model.model_validate(entity["value"])
    return validated_model.model_dump(), path_mapping
