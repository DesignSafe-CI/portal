"""Operations to format and manage Datacite DOIs"""

import datetime
from typing import Optional
import json
import requests
import networkx as nx
from django.conf import settings
from designsafe.apps.api.projects_v2 import constants
from designsafe.apps.api.projects_v2.schema_models import PATH_SLUGS


# pylint: disable=too-many-locals, too-many-branches, too-many-statements
def get_datacite_json(
    pub_graph: nx.DiGraph, entity_uuid: str, version: Optional[int] = 1
):
    """
    Generate datacite payload for a publishable entity. `pub_graph` is the output of
    either `get_publication_subtree` or `get_publication_full_tree`.
    """

    datacite_json = {}
    is_other = pub_graph.nodes["NODE_ROOT"].get("projectType", None) in [
        "other",
        "field_research",
    ]
    if is_other:
        base_meta_node = next(
            (
                node
                for node in pub_graph
                if pub_graph.nodes[node]["name"] == constants.PROJECT
                and pub_graph.nodes[node]["version"] == version
            ),
            None,
        )
    else:
        base_meta_node = "NODE_ROOT"

    base_meta = pub_graph.nodes[base_meta_node]["value"]

    entity_node = base_meta_node = next(
        (
            node
            for node in pub_graph
            if pub_graph.nodes[node]["uuid"] == entity_uuid
            and pub_graph.nodes[node]["version"] == version
        ),
        None,
    )

    author_attr = []
    institutions = []
    entity_meta = pub_graph.nodes[entity_node]["value"]
    authors = entity_meta.get("authors", [])
    datacite_authors = [
        author for author in authors if not author.get("authorship") is False
    ]
    for author in datacite_authors:
        author_attr.append(
            {
                "name": f"{author.get('lname', '')}, {author.get('fname', '')}",
                "givenName": author.get("fname", ""),
                "familyName": author.get("lname", ""),
                "affiliation": [
                    {
                        "name": author.get("inst", ""),
                        "schemeUri": None,
                        "affiliationIdentifier": None,
                        "affiliationIdentifierScheme": None,
                    }
                ],
            }
        )
        institutions.append(author.get("inst", ""))

    datacite_json["contributors"] = [
        {
            "contributorType": "HostingInstitution",
            "nameType": "Organizational",
            "name": institution,
        }
        for institution in list(set(institutions))
    ]
    datacite_json["creators"] = author_attr

    if not is_other:

        datacite_json["titles"] = [
            {"title": f"{title}, in {base_meta['title']}"}
            for title in set([entity_meta["title"]])
        ]
    else:
        datacite_json["titles"] = [
            {"title": title} for title in set([entity_meta["title"]])
        ]
    datacite_json["publisher"] = "Designsafe-CI"

    if version == 1 or not version:
        initial_pub_date = pub_graph.nodes[entity_node]["publicationDate"]
        datacite_json["publicationYear"] = datetime.datetime.fromisoformat(
            initial_pub_date
        ).year

    datacite_json["types"] = {}

    datacite_json["types"]["resourceType"] = PATH_SLUGS.get(
        pub_graph.nodes[entity_node]["name"]
    )
    if data_type := entity_meta.get("dataType", None):
        datacite_json["types"]["resourceType"] += f"/{data_type['name']}"
    if exp_type := entity_meta.get("experimentType", None):
        datacite_json["types"]["resourceType"] += f"/{exp_type['name']}"
    if sim_type := entity_meta.get("simulationType", None):
        datacite_json["types"]["resourceType"] += f"/{sim_type['name']}"
    if location := entity_meta.get("location", None):
        datacite_json["types"]["resourceType"] += f"/{location}"

    datacite_json["types"]["resourceTypeGeneral"] = "Dataset"
    datacite_json["version"] = version

    datacite_json["descriptions"] = [
        {
            "descriptionType": "Abstract",
            "description": desc,
            "lang": "en-Us",
        }
        for desc in set([base_meta["description"], entity_meta["description"]])
    ]

    if not is_other:
        all_keywords = base_meta.get("keywords", []) + entity_meta.get("keywords", [])
        datacite_json["subjects"] = [{"subject": keyword} for keyword in all_keywords]
    else:
        datacite_json["subjects"] = [
            {"subject": keyword} for keyword in base_meta.get("keywords", [])
        ]

    facilities = entity_meta.get("facilities", [])
    if exp_facility := entity_meta.get("facility", None):
        facilities.append(exp_facility)

    for facility in facilities:
        datacite_json["subjects"].append(facility["name"])
        datacite_json["contributors"].append(
            {
                "contributorType": "HostingInstitution",
                "nameType": "Organizational",
                "name": facility["name"],
            }
        )

    datacite_json["language"] = "English"
    datacite_json["identifiers"] = [
        {
            "identifierType": "Project ID",
            "identifier": base_meta["projectId"],
        }
    ]

    datacite_json["fundingReferences"] = [
        {
            "awardTitle": award["name"],
            "awardNumber": award["number"],
            "funderName": award.get("fundingSource", "N/A") or "N/A",
        }
        for award in base_meta["awardNumbers"]
    ]

    datacite_json["relatedIdentifiers"] = []
    relation_mapping = {
        "Linked Project": "IsPartOf",
        "Linked Dataset": "IsPartOf",
        "Cited By": "IsCitedBy",
        "Context": "IsDocumentedBy",
    }
    for a_proj in entity_meta.get("associatedProjects", []):  # relatedwork
        identifier = {}
        if {"type", "href", "hrefType"} <= a_proj.keys():
            identifier["relationType"] = relation_mapping[a_proj["type"]]
            identifier["relatedIdentifierType"] = a_proj["hrefType"].upper()
            identifier["relatedIdentifier"] = a_proj["href"]
            datacite_json["relatedIdentifiers"].append(identifier)

    for r_data in entity_meta.get("referencedData", []):
        identifier = {}
        if {"doi", "hrefType"} <= r_data.keys():
            identifier["relationType"] = "References"
            identifier["relatedIdentifier"] = r_data["doi"]
            identifier["relatedIdentifierType"] = r_data["hrefType"].upper()
            datacite_json["relatedIdentifiers"].append(identifier)

    project_id = base_meta["projectId"]
    datacite_url = f"https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{project_id}"
    if not is_other:
        datacite_url += f"/#detail-{entity_uuid}"
    if version and version > 1:
        datacite_url += f"/?version={version}"

    datacite_json["rightsList"] = [
        {
            "lang": "en",
            "rights": base_meta["license"],
            "rightsUri": None,
            "schemeUri": None,
            "rightsIdentifier": None,
            "rightsIdentifierScheme": None,
        }
    ]

    datacite_json["url"] = datacite_url
    datacite_json["prefix"] = settings.DATACITE_SHOULDER

    return datacite_json


def upsert_datacite_json(datacite_json: dict, doi: Optional[str] = None):
    """
    Create a draft DOI in datacite with the specified metadata. If a DOI is specified,
    the metadata for that DOI is updated instead.
    """
    if doi:
        datacite_json.pop("publicationYear", None)

    datacite_payload = {
        "data": {
            "type": "dois",
            "relationships": {
                "client": {"data": {"type": "clients", "id": "tdl.tacc"}}
            },
            "attributes": datacite_json,
        }
    }
    if not doi:
        res = requests.post(
            f"{settings.DATACITE_URL.strip('/')}/dois",
            auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
            data=json.dumps(datacite_payload),
            headers={"Content-Type": "application/vnd.api+json"},
            timeout=30,
        )
    else:
        res = requests.put(
            f"{settings.DATACITE_URL.strip('/')}/dois/{doi}",
            auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
            data=json.dumps(datacite_payload),
            headers={"Content-Type": "application/vnd.api+json"},
            timeout=30,
        )

    return res.json()


def publish_datacite_doi(doi: str):
    """
    Set a DOI's status to `Findable` in Datacite.
    """
    payload = {"data": {"type": "dois", "attributes": {"event": "publish"}}}

    res = requests.put(
        f"{settings.DATACITE_URL.strip('/')}/dois/{doi}",
        auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
        data=json.dumps(payload),
        headers={"Content-Type": "application/vnd.api+json"},
        timeout=30,
    )
    return res.json()


def hide_datacite_doi(doi: str):
    """
    Remove a Datacite DOI from public consumption.
    """
    payload = {"data": {"type": "dois", "attributes": {"event": "hide"}}}

    res = requests.put(
        f"{settings.DATACITE_URL.strip('/')}/dois/{doi}",
        auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
        data=json.dumps(payload),
        headers={"Content-Type": "application/vnd.api+json"},
        timeout=30,
    )
    return res.json()


def get_doi_publication_date(doi: str) -> str:
    """Look up the publication date for a DOI"""
    res = requests.get(f"{settings.DATACITE_URL.strip('/')}/dois/{doi}", timeout=30)
    res.raise_for_status()
    return res.json()["data"]["attributes"]["created"]
