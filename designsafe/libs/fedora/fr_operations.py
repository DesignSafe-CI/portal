import requests
from requests import HTTPError
from django.conf import settings
import json
import magic
import os
import hashlib
from urllib import parse
from io import StringIO
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from designsafe.apps.data.models.elasticsearch import IndexedPublication
from django.contrib.auth import get_user_model
from designsafe.libs.fedora.fedora_operations import (
    format_metadata_for_fedora,
    fedora_post,
    fedora_update,
    create_fc_version,
    upload_manifest,
    generate_manifest,
    has_associations,
)
import logging

logger = logging.getLogger(__name__)


def walk_fr(project_id, version=None):
    """
    Walk an FR project and reconstruct parent/child relationships

    Params
    ------
    project_id: Project ID to look up (e.g. PRJ-1234)

    Returns
    -------
    dict: dict in form {'uuid-ex-1':
                        {'children': ['title of child 1', ...],
                        'parent': 'title of parent',
                        'container_path': 'path/relative/to/fcroot',
                        'fedora_mapping': {}}}
    """
    from urllib import parse

    doc = IndexedPublication.from_id(project_id, revision=version)

    relation_map = []

    project_meta = format_metadata_for_fedora(project_id, version=version)
    if version:
        project_id = "{}v{}".format(project_id, str(version))
    license = project_meta.get("license", None)

    project_map = {
        "uuid": doc.project.uuid,
        "container_path": project_id,
        "fedora_mapping": {**project_meta, "generated": [], "license": None},
        "fileObjs": [],
        "fileTags": [],
    }

    docs_list = getattr(doc, "reports", [])
    for document in docs_list:
        # Do stuff with FR Documents.
        doc_container_path = "{}/{}".format(
            project_id, parse.quote(document.value.title)
        )
        print("doc " + document.value.title)
        doc_doi = document.doi
        project_map["fedora_mapping"]["generated"].append(
            "Documents: {}".format(doc_doi)
        )

        doc_map = {
            "uuid": document.uuid,
            "container_path": doc_container_path,
            "fedora_mapping": {
                **format_docs(document),
                "license": license,
                "wasGeneratedBy": project_id,
                "generated": [],
                "hasVersion": version,
            },
            "fileObjs": document.fileObjs,
            "fileTags": getattr(document.value, "fileTags", []),
        }

        relation_map.append(doc_map)

    missions_list = getattr(doc, "missions", [])
    for mission in missions_list:
        # Do stuff with FR Missions.
        mission_container_path = "{}/{}".format(
            project_id, parse.quote(mission.value.title)
        )
        print("mission " + mission.value.title)
        mission_doi = mission.doi
        project_map["fedora_mapping"]["generated"].append(
            "Mission: {}".format(mission_doi)
        )

        mission_map = {
            "uuid": mission.uuid,
            "container_path": mission_container_path,
            "fedora_mapping": {
                **format_mission(mission),
                "license": license,
                "wasGeneratedBy": project_id,
                "generated": [],
                "hasVersion": version,
            },
            "fileObjs": [],
            "fileTags": getattr(mission.value, "fileTags", []),
        }

        collections = filter(
            lambda collection: mission.uuid in collection.value.missions,
            getattr(doc, "collections", []),
        )
        for collection in collections:
            # Do stuff with report.
            collection_container_path = "{}/{}".format(
                mission_container_path, parse.quote(collection.value.title)
            )
            print("\tcollection " + collection.value.title)
            mission_map["fedora_mapping"]["generated"].append(
                "Collection: {}".format(collection.value.title)
            )

            collection_map = {
                "uuid": collection.uuid,
                "fileObjs": collection.fileObjs,
                "fileTags": getattr(collection.value, "fileTags", []),
                "container_path": collection_container_path,
                "fedora_mapping": {
                    **format_geo(collection),
                    "wasGeneratedBy": "Mission: {}".format(mission_doi),
                },
            }
            relation_map.append(collection_map)

        geoscience = filter(
            lambda geo: mission.uuid in geo.value.missions,
            getattr(doc, "geoscience", []),
        )
        for geo_collection in geoscience:
            # Do stuff with report.
            geo_container_path = "{}/{}".format(
                mission_container_path, parse.quote(geo_collection.value.title)
            )
            print("\tgeo collection " + geo_collection.value.title)
            mission_map["fedora_mapping"]["generated"].append(
                "Engineering/Geosciences Collection: {}".format(
                    geo_collection.value.title
                )
            )

            collection_map = {
                "uuid": geo_collection.uuid,
                "fileObjs": geo_collection.fileObjs,
                "fileTags": getattr(geo_collection.value, "fileTags", []),
                "container_path": geo_container_path,
                "fedora_mapping": {
                    **format_geo(geo_collection),
                    "wasGeneratedBy": "Mission: {}".format(mission_doi),
                },
            }
            relation_map.append(collection_map)

        socialscience = filter(
            lambda soc: mission.uuid in soc.value.missions,
            getattr(doc, "socialscience", []),
        )
        for soc_collection in socialscience:
            # Do stuff with report.
            soc_container_path = "{}/{}".format(
                mission_container_path, parse.quote(soc_collection.value.title)
            )
            print("\tsoc collection " + soc_collection.value.title)
            mission_map["fedora_mapping"]["generated"].append(
                "Social Sciences Collection: {}".format(soc_collection.value.title)
            )

            collection_map = {
                "uuid": soc_collection.uuid,
                "fileObjs": soc_collection.fileObjs,
                "fileTags": getattr(soc_collection.value, "fileTags", []),
                "container_path": soc_container_path,
                "fedora_mapping": {
                    **format_soc(soc_collection),
                    "wasGeneratedBy": "Mission: {}".format(mission_doi),
                },
            }
            relation_map.append(collection_map)

        planning = filter(
            lambda planning: mission.uuid in planning.value.missions,
            getattr(doc, "planning", []),
        )
        for planning_coll in planning:
            # Do stuff with report.
            planning_container_path = "{}/{}".format(
                mission_container_path, parse.quote(planning_coll.value.title)
            )
            print("\tplanning collection " + planning_coll.value.title)
            mission_map["fedora_mapping"]["generated"].append(
                "Social Sciences Collection: {}".format(planning_coll.value.title)
            )

            collection_map = {
                "uuid": planning_coll.uuid,
                "fileObjs": planning_coll.fileObjs,
                "fileTags": getattr(planning_coll.value, "fileTags", []),
                "container_path": planning_container_path,
                "fedora_mapping": {
                    **format_planning(planning_coll),
                    "wasGeneratedBy": "Mission: {}".format(mission_doi),
                },
            }
            relation_map.append(collection_map)

        relation_map.append(mission_map)
    # project_map['fedora_mapping']['creator'] = list(set(full_author_list))
    relation_map.append(project_map)

    return relation_map[::-1]


def format_mission(mission):
    coverage = []
    nh_start = getattr(mission.value, "dateStart", None)
    nh_end = getattr(mission.value, "dateEnd", None)
    nh_location = getattr(mission.value, "location", None)
    if nh_start:
        coverage.append(nh_start)
    if nh_end:
        coverage.append(nh_end)
    if nh_location:
        coverage.append(nh_location)

    facility = getattr(mission.value, "facility", {}).get("name", None)

    author_list = list(
        map(lambda member: "{}, {}".format(member.lname, member.fname), mission.authors)
    )

    return {
        "title": mission.value.title,
        "publisher": "DesignSafe",
        "description": mission.value.description,
        "coverage": coverage,
        "subject": getattr(mission.value, "event", None),
        "identifier": getattr(mission, "doi", None),
        "contributor": facility,
        "creator": author_list,
        "available": mission.lastUpdated,
    }


def format_docs(docs):
    facility = getattr(docs.value, "facility", {}).get("name", None)

    author_list = list(
        map(lambda member: "{}, {}".format(member.lname, member.fname), docs.authors)
    )

    res = {
        "title": docs.value.title,
        "description": docs.value.description,
        "contributor": facility,
        "creator": author_list,
        "available": docs.created,
        "date": docs.lastUpdated,
    }
    return res


def format_member(member):
    try:
        return f"{member.lname}, {member.fname}"
    except AttributeError:
        user_obj = get_user_model().objects.get(username=member.name)
        return "{}, {}".format(user_obj.last_name, user_obj.first_name)


def format_soc(soc):
    """Format social sciences collection"""
    coverage = []
    nh_start = getattr(soc.value, "dateStart", None)
    nh_end = getattr(soc.value, "dateEnd", None)
    nh_location = getattr(soc.value, "location", None)
    equipment = getattr(soc.value, "equipment", None)
    if nh_start:
        coverage.append(nh_start)
    if nh_end:
        coverage.append(nh_end)
    if nh_location:
        coverage.append(nh_location)
    if equipment:
        coverage += equipment

    subject = []
    subject += getattr(soc.value, "modes", [])
    subject += getattr(soc.value, "sampleApproach", [])
    if getattr(soc.value, "unit", None) is not None:
        subject += [f"Unit: {soc.value.unit}"]
    if getattr(soc.value, "sampleSize", None) is not None:
        subject += [f"Sample size: {soc.value.sampleSize}"]

    author_list = list(map(format_member, soc.value.dataCollectors))

    res = {
        "type": "Social Science/dataset",
        "description": soc.value.description,
        "title": soc.value.title,
        "coverage": coverage,
        "subject": subject,
        "restriction": getattr(soc.value, "restriction", None),
        "contributor": author_list,
    }
    print(res)
    return res


def format_planning(planning):
    author_list = list(map(format_member, planning.value.dataCollectors))
    res = {
        "type": "Research Planning Collection",
        "title": planning.value.title,
        "description": planning.value.description,
        "contributor": author_list,
    }
    return res


def format_geo(geo):
    subject = []
    subject += getattr(geo.value, "observationTypes", [])
    subject += getattr(geo.value, "equipment", [])

    coverage = []
    nh_start = getattr(geo.value, "dateStart", None)
    nh_end = getattr(geo.value, "dateEnd", None)
    nh_location = getattr(geo.value, "location", None)
    if nh_start:
        coverage.append(nh_start)
    if nh_end:
        coverage.append(nh_end)
    if nh_location:
        coverage.append(nh_location)

    author_list = list(map(format_member, geo.value.dataCollectors))
    res = {
        "type": "Engineering Geosciences Collection",
        "title": geo.value.title,
        "description": geo.value.description,
        "subject": subject,
        "contributor": author_list,
        "coverage": coverage,
    }
    return res


def generate_manifest_fr(project_id, version=None):
    walk_result = walk_fr(project_id, version=version)
    return generate_manifest(walk_result, project_id, version)


def upload_manifest_fr(project_id, version=None):
    manifest_dict = generate_manifest_fr(project_id, version=version)
    return upload_manifest(manifest_dict, project_id, version)


def ingest_project_fr(project_id, version=None, amend=False):
    """
    Ingest a project into Fedora by creating a record in the repo, updating it
    with the published metadata, and uploading its files.
    """
    container_path = project_id
    if version:
        container_path = "{}v{}".format(container_path, str(version))

    walk_result = walk_fr(project_id, version=version)
    for entity in walk_result:
        if amend:
            create_fc_version(entity["container_path"])
        fedora_post(entity["container_path"])
        fedora_update(entity["container_path"], entity["fedora_mapping"])

    if not amend:
        upload_manifest_fr(project_id, version=version)
