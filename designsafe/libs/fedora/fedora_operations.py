import requests
from requests import HTTPError
from django.conf import settings
import json
import magic
import os
from urllib import parse
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from designsafe.apps.data.models.elasticsearch import IndexedPublication
from designsafe.apps.api.publications.operations import _get_user_by_username
import logging
logger = logging.getLogger(__name__)

FEDORA_HEADERS = {
    'accept': 'application/ld+json;profile="http://www.w3.org/ns/json-ld#compacted"',
    'content-type': 'application/ld+json'
}

PUBLICATIONS_CONTAINER = settings.FEDORA_CONTAINER
PUBLICATIONS_MOUNT_ROOT = '/corral-repl/tacc/NHERI/published/'

FEDORA_CONTEXT = {
    "description": {
        "@id": "http://purl.org/dc/elements/1.1/description"
    },
    "title": {
        "@id": "http://purl.org/dc/elements/1.1/title"
    },
    "identifier": {
        "@id": "http://purl.org/dc/elements/1.1/identifier"
    },
    "subject": {
        "@id": "http://purl.org/dc/elements/1.1/subject"
    },
    "creator": {
        "@id": "http://purl.org/dc/elements/1.1/creator"
    },
    "license": {
        "@id": "http://purl.org/dc/elements/1.1/license"
    },
    "contributor": {
        "@id": "http://purl.org/dc/elements/1.1/contributor"
    },
    "type": {
        "@id": "http://purl.org/dc/elements/1.1/type"
    },
    "issued": {
        "@id": "http://purl.org/dc/elements/1.1/issued"
    },
    "publisher": {
        "@id": "http://purl.org/dc/elements/1.1/publisher"
    },
    "references": {
        "@id": "http://purl.org/dc/elements/1.1/references"
    },
    "relation": {
        "@id": "http://purl.org/dc/elements/1.1/relation"
    },
    "entity": {
        "@id": "https://www.w3.org/TR/2013/REC-prov-o-20130430/#Entity"
    },
    "wasAttributedTo": {
        "@id": "https://www.w3.org/TR/2013/REC-prov-o-20130430/#wasAttributedTo"
    },
    "generatedAtTime": {
        "@id": "https://www.w3.org/TR/2013/REC-prov-o-20130430/#generatedAtTime"
    },
    "wasDerivedFrom": {
        "@id": "https://www.w3.org/TR/2013/REC-prov-o-20130430/#wasDerivedFrom"
    }
}


def fedora_get(project_id):
    """
    Get publication metadata from Fedora in compact JSON format.

    Params
    ------
    project_id: Project ID to look up (e.g. PRJ-1234)

    Returns
    -------
    dict: Publication metadata in compact JSON format.
    """
    request = requests.get('{}{}/{}'.format(settings.FEDORA_URL,
                                            PUBLICATIONS_CONTAINER,
                                            project_id),
                           auth=(settings.FEDORA_USERNAME,
                                 settings.FEDORA_PASSWORD),
                           headers=FEDORA_HEADERS)
    request.raise_for_status()
    return request.json()


def fedora_post(container_path, data_container=True):
    """"
    Create a Fedora container for a project if none exists; otherwise, return
    existing metadata for that project.

    Params
    ------
    container_path: Path to create the container relative to the publication
        root. (e.g. PRJ-1234)
    data_container: If truthy, create an additional "/data" container under
        container_path.

    Returns
    -------
    dict: Publication metadata in compact JSON format.
    """
    fc_url = '{}{}/{}'.format(settings.FEDORA_URL,
                              PUBLICATIONS_CONTAINER, container_path)
    try:
        request = requests.put(fc_url,
                               auth=(settings.FEDORA_USERNAME,
                                     settings.FEDORA_PASSWORD))
        request.raise_for_status()

        if data_container:
            dc_request = requests.put(fc_url + "/data",
                                      auth=(settings.FEDORA_USERNAME,
                                            settings.FEDORA_PASSWORD))
            dc_request.raise_for_status()

    except HTTPError as error:
        if error.response.status_code == 409:
            return fedora_get(container_path)
        raise error


def fedora_update(project_id, update_body={}):
    """"
    Patches a Fedora container with updated metadata.

    Params
    ------
    project_id: Project ID to look up (e.g. PRJ-1234)
    update_body: Dictionary of fields to update. Fields not contained in the
    update body will be unchanged.

    Returns
    -------
    dict: Publication metadata in compact JSON format.
    """
    initial_data = fedora_get(project_id)
    updated_data = {**initial_data, **update_body}
    updated_data['@context'] = {**initial_data['@context'], **FEDORA_CONTEXT}
    updated_data['@type'] = initial_data['@type'] + ['http://purl.org/dc/dcmitype/Dataset']

    request = requests.put('{}{}/{}'.format(settings.FEDORA_URL,
                                            PUBLICATIONS_CONTAINER, project_id),
                           auth=(settings.FEDORA_USERNAME,
                                 settings.FEDORA_PASSWORD),
                           headers=FEDORA_HEADERS,
                           data=json.dumps(updated_data))
    request.raise_for_status()
    return fedora_get(project_id)


def format_metadata_for_fedora(project_id, version=None):
    """
    Format a publication's metadata so that it can be ingested into Fedora.
    """
    doc = IndexedPublication.from_id(project_id)
    pub_meta = doc.project.value

    author_list = []
    try:
        ordered_team = sorted(pub_meta.teamOrder, key=lambda member: member.order)
        author_list = list(map(lambda member: "{}, {}".format(member.lname,
                                                              member.fname),
                               ordered_team))
    except AttributeError:
        author_list = [_get_user_by_username(doc, pub_meta.pi)]

    award_numbers = getattr(pub_meta, 'awardNumbers', [])
    contributors = []
    for award in award_numbers:
        contributors.append(award['name'] or None)
        contributors.append(award['number'] or None)

    identifiers = [pub_meta.projectId,
                   'https://https://www.designsafe-ci.org/'
                   'data/browser/public/designsafe.storage.published/{}'
                   .format(pub_meta.projectId)]
    identifiers += getattr(pub_meta, 'dois', [])
    identifiers += [getattr(doc.project, 'doi', None)]

    fc_meta = {
        'title': pub_meta.title,
        'entity': pub_meta.title,
        'description': pub_meta.description,
        'identifier': identifiers,
        'subject': pub_meta.keywords.split(', '),
        'creator': author_list,
        'wasAttributedTo': author_list,
        'issued': doc.project.created.isoformat(),
        'generatedAtTime': doc.project.created.isoformat(),
        'contributor': contributors,
        'type': getattr(pub_meta, 'dataType', "other"),
        'publisher': 'Designsafe',
    }

    licenses = getattr(doc, 'licenses', None)
    if licenses:
        fc_meta['license'] = list(licenses.to_dict().values())

    associated_projects = getattr(pub_meta, 'associatedProjects', None)
    if associated_projects:
        references = list(map(lambda assoc: assoc['title'], associated_projects))
        relation = list(map(lambda assoc: assoc['href'], associated_projects))

        fc_meta['references'] = references
        fc_meta['relation'] = relation

    return fc_meta


def create_fc_version(container_path):
    """Create a new version of the publication in Fedora. This uses Fedora's
    versioning system and is meant to be used for amendments in the publication
    pipeline."""

    try:
        request = requests.post('{}{}/{}/fcr:versions'.format(settings.FEDORA_URL,
                                                              PUBLICATIONS_CONTAINER, container_path),
                                auth=(settings.FEDORA_USERNAME,
                                      settings.FEDORA_PASSWORD))
        request.raise_for_status()
    except HTTPError as error:
        if error.response.status_code == 409:
            return fedora_get(container_path)
        raise error


def ingest_files_other(project_id, version=None):
    """
    Ingest an Other type publication's files into fedora. All files are ingested
    as children of the base project, with a slug that indicates the path in the
    directory hierarchy.
    """

    retry_strategy = Retry(
        total=3,
        backoff_factor=5
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    http = requests.Session()
    http.mount("https://", adapter)
    http.mount("http://", adapter)

    archive_path = os.path.join(PUBLICATIONS_MOUNT_ROOT, project_id)
    fedora_root = parse.urljoin(settings.FEDORA_URL, PUBLICATIONS_CONTAINER)
    for root, _, files in os.walk(archive_path):

        for file in files:
            headers = {'Content-Type': 'text/plain'}
            mime = magic.Magic(mime=True)
            headers['Content-Type'] = mime.from_file(os.path.join(root, file))
            # project_archive_path will be something like /corral-repl/tacc/NHERI/published/PRJ-1234
            project_archive_path = os.path.join(PUBLICATIONS_MOUNT_ROOT, project_id)
            # fc_relative_path is of form /PRJ-1234/data/path/to/folder/file
            fc_relative_path = os.path.join(project_id, 'data', root.replace(project_archive_path, '', 1).strip('/'), file)
            fc_put_url = os.path.join(fedora_root, parse.quote(fc_relative_path))
            with open(os.path.join(root, file), 'rb') as _file:
                try:
                    pass
                    request = http.put(fc_put_url,
                                       auth=(settings.FEDORA_USERNAME,
                                             settings.FEDORA_PASSWORD),
                                       headers=headers,
                                       data=_file)
                    request.raise_for_status()
                except HTTPError:
                    logger.error('Fedora ingest failed: {}'.format(fc_put_url))


def ingest_project(project_id, upload_files=True, version=None):
    """
    Ingest a project into Fedora by creating a record in the repo, updating it
    with the published metadata, and uploading its files.
    """
    container_path = project_id
    if version:
        container_path = '{}v{}'.format(container_path, str(version))
    fedora_post(container_path)
    project_meta = format_metadata_for_fedora(project_id)
    res = fedora_update(container_path, project_meta)
    if upload_files:
        ingest_files_other(container_path)
    return res


def amend_project_fedora(project_id, version=None):
    """Amend a publication by creating a new version in Fedora and updating the
    metadata"""
    container_path = project_id
    if version:
        container_path = '{}v{}'.format(container_path, str(version))

    create_fc_version(container_path)
    project_meta = format_metadata_for_fedora(project_id)
    res = fedora_update(container_path, project_meta)
    return res


def walk_experimental(project_id):
    """
    Walk an experimental project and reconstruct parent/child relationships

    Params
    ------
    project_id: Project ID to look up (e.g. PRJ-1234)

    Returns
    -------
    dict: dict in form {'uuid-ex-1':
                        {children: ['uuid-ex-2'],
                        parent: 'uuid-ex-3'}}
    """
    from urllib import parse
    doc = IndexedPublication.from_id(project_id)
    relation_map = {doc.project.uuid: {'children': []}}
    experiments_list = doc.experimentsList
    for expt in experiments_list:
        # Do stuff with experiment.
        print('experiment ' + expt.value.title)
        relation_map[expt.uuid] = {'children': []}
        relation_map[expt.uuid]['parent'] = doc.project.uuid
        relation_map[doc.project.uuid]['children'].append(expt.uuid)

        reports = filter(
            lambda report: expt.uuid in report.value.experiments,
            getattr(doc, 'reportsList', []))
        for report in reports:
            # Do stuff with report.
            print('\treport ' + report.value.title)
            relation_map[report.uuid] = {}
            relation_map[report.uuid]['parent'] = expt.uuid
            relation_map[expt.uuid]['children'].append(report.uuid)

        analysis_list = filter(
            lambda analysis: expt.uuid in analysis.value.experiments,
            getattr(doc, 'analysisList', []))
        for analysis in analysis_list:
            # Do stuff with analysis.
            print('\tanalysis ' + analysis.value.title)
            relation_map[analysis.uuid] = {}
            relation_map[analysis.uuid]['parent'] = expt.uuid
            relation_map[expt.uuid]['children'].append(analysis.uuid)

        model_configs = filter(
            lambda model_config: expt.uuid in model_config.value.experiments,
            getattr(doc, 'modelConfigs', []))
        for mc in model_configs:
            # Do stuff with model config.
            print('\tmodel config ' + mc.value.title)
            relation_map[mc.uuid] = {'children': []}
            relation_map[mc.uuid]['parent'] = expt.uuid
            relation_map[expt.uuid]['children'].append(mc.uuid)

            sensor_lists = filter(
                lambda sensor_list: mc.uuid in sensor_list.value.modelConfigs,
                getattr(doc, 'sensorLists', []))
            for sl in sensor_lists:
                # Do stuff with sensor list.
                print('\t\tsensor list ' + sl.value.title)
                relation_map[sl.uuid] = {'children': []}
                relation_map[sl.uuid]['parent'] = mc.uuid
                relation_map[mc.uuid]['children'].append(sl.uuid)

                events = filter(
                    lambda event: sl.uuid in event.value.sensorLists,
                    getattr(doc, 'eventsList', []))
                for event in events:
                    # Do stuff with events.
                    print('\t\t\tevent ' + event.value.title)
                    relation_map[event.uuid] = {}
                    relation_map[event.uuid]['parent'] = mc.uuid
                    relation_map[sl.uuid]['children'].append(event.uuid)

    return relation_map
