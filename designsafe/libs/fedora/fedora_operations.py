import requests
from requests import HTTPError
from django.conf import settings
import json
import magic
import os
import hashlib
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
    "available": {
        "@id": "http://purl.org/dc/elements/1.1/available"
    },
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
    "date": {
        "@id": "http://purl.org/dc/elements/1.1/date"
    },
    "_created": {
        "@id": "http://purl.org/dc/elements/1.1/created"
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
    "isPartOf": {
        "@id": "http://purl.org/dc/terms/isPartOf"
    },
    "hasPart": {
        "@id": "http://purl.org/dc/terms/hasPart"
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
    },
    "generated": {
        "@id": "https://www.w3.org/TR/2013/REC-prov-o-20130430/#generated"
    },
    "wasGeneratedBy": {
        "@id": "https://www.w3.org/TR/2013/REC-prov-o-20130430/#wasGeneratedBy"
    },
    "wasDerivedFrom": {
        "@id": "https://www.w3.org/TR/2013/REC-prov-o-20130430/#wasDerivedFrom"
    },
    "wasInfluencedBy": {
        "@id": "https://www.w3.org/TR/2013/REC-prov-o-20130430/#wasInfluencedBy"
    },
    "influenced": {
        "@id": "https://www.w3.org/TR/2013/REC-prov-o-20130430/#influenced"
    }
}


def fedora_get(project_id, relative_to_root=True):
    """
    Get publication metadata from Fedora in compact JSON format.

    Params
    ------
    project_id: Project ID to look up (e.g. PRJ-1234)

    Returns
    -------
    dict: Publication metadata in compact JSON format.
    """
    url = project_id
    if relative_to_root:
        url = '{}{}/{}'.format(settings.FEDORA_URL,
                               PUBLICATIONS_CONTAINER,
                               project_id)

    request = requests.get(url,
                           auth=(settings.FEDORA_USERNAME,
                                 settings.FEDORA_PASSWORD),
                           headers=FEDORA_HEADERS)
    request.raise_for_status()
    return request.json()


def fedora_post(container_path):
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

    except HTTPError as error:
        if error.response.status_code == 409:
            return fedora_get(container_path)
        raise error


def fedora_update(container_path, update_body={}):
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
    initial_data = fedora_get(container_path)
    updated_data = {**initial_data, **update_body}
    updated_data['@context'] = {**initial_data['@context'], **FEDORA_CONTEXT}
    updated_data['@type'] = initial_data['@type'] + ['http://purl.org/dc/dcmitype/Dataset']
    request = requests.put('{}{}/{}'.format(settings.FEDORA_URL,
                                            PUBLICATIONS_CONTAINER, container_path),
                           auth=(settings.FEDORA_USERNAME,
                                 settings.FEDORA_PASSWORD),
                           headers=FEDORA_HEADERS,
                           data=json.dumps(updated_data))
    request.raise_for_status()
    return fedora_get(container_path)


def format_metadata_for_fedora(project_id, version=None):
    """
    Format a publication's metadata so that it can be ingested into Fedora.
    """
    doc = IndexedPublication.from_id(project_id, revision=version)
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
                   'https://www.designsafe-ci.org/'
                   'data/browser/public/designsafe.storage.published/{}'
                   .format(pub_meta.projectId),
                   doc.project.uuid]
    identifiers += getattr(pub_meta, 'dois', [])
    identifiers += [getattr(doc.project, 'doi', None)]

    project_type = pub_meta.projectType
    if project_type == 'other':
        project_type = getattr(pub_meta, 'dataType', "other"),

    fc_meta = {
        'title': pub_meta.title,
        'entity': 'Project',
        'description': pub_meta.description,
        'identifier': identifiers,
        'subject': pub_meta.keywords.split(', '),
        'creator': author_list,
        'issued': doc.project.created.isoformat(),
        'contributor': contributors,
        'type': project_type,
        'publisher': 'Designsafe',
    }

    licenses = getattr(doc, 'licenses', None)
    if licenses:
        fc_meta['license'] = list(licenses.to_dict().values())

    associated_projects = getattr(pub_meta, 'associatedProjects', None)
    if associated_projects:
        references = list(map(lambda assoc: assoc['title'], associated_projects))
        try:
            relation = list(map(lambda assoc: assoc['href'], associated_projects))
        except KeyError:
            relation = []

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
                    request = http.put(fc_put_url,
                                       auth=(settings.FEDORA_USERNAME,
                                             settings.FEDORA_PASSWORD),
                                       headers=headers,
                                       data=_file)
                    request.raise_for_status()
                except HTTPError:
                    logger.error('Fedora ingest failed: {}'.format(fc_put_url))


def ingest_project(project_id, upload_files=False, version=None):
    """
    Ingest a project into Fedora by creating a record in the repo, updating it
    with the published metadata, and uploading its files.
    """
    container_path = project_id
    if version:
        container_path = '{}v{}'.format(container_path, str(version))
    fedora_post(container_path)
    project_meta = format_metadata_for_fedora(project_id, version=version)
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
                        {'children': ['title of child 1', ...],
                        'parent': 'title of parent',
                        'container_path': 'path/relative/to/fcroot',
                        'fedora_mapping': {}}}
    """
    from urllib import parse
    doc = IndexedPublication.from_id(project_id)
    relation_map = []

    project_meta = format_metadata_for_fedora(project_id)
    license = project_meta.get('license', None)
    full_author_list = []
    project_map = {
        'uuid': doc.project.uuid,
        'container_path': project_id,
        'fedora_mapping': {**project_meta, 'generated': [], 'license': None},
        'fileObjs': []
    }

    experiments_list = doc.experimentsList
    for expt in experiments_list:
        # Do stuff with experiment.
        expt_container_path = "{}/{}".format(project_id, parse.quote(expt.value.title))
        print('experiment ' + expt.value.title)
        exp_doi = expt.doi
        project_map['fedora_mapping']['generated'].append('Experiment: {}'.format(exp_doi))

        experiment_map = {
            'uuid': expt.uuid,
            'container_path': expt_container_path,
            'fedora_mapping': {**format_experiment(expt), 'license': license, 'wasGeneratedBy': project_id, 'generated': []},
            'fileObjs': expt.fileObjs
        }

        full_author_list += experiment_map['fedora_mapping']['creator']

        reports = filter(
            lambda report: expt.uuid in report.value.experiments,
            getattr(doc, 'reportsList', []))
        for report in reports:
            # Do stuff with report.
            report_container_path = "{}/{}".format(expt_container_path, parse.quote(report.value.title))
            print('\treport ' + report.value.title)
            experiment_map['fedora_mapping']['generated'].append('Report: {}'.format(report.value.title))

            report_map = {
                'uuid': report.uuid,
                'fileObjs': report.fileObjs,
                'container_path': report_container_path,
                'fedora_mapping': {**format_report(report), 'wasGeneratedBy': 'Experiment: {}'.format(exp_doi)}
            }
            relation_map.append(report_map)

        analysis_list = filter(
            lambda analysis: expt.uuid in analysis.value.experiments,
            getattr(doc, 'analysisList', []))
        for analysis in analysis_list:
            # Do stuff with analysis.
            analysis_container_path = "{}/{}".format(expt_container_path, parse.quote(analysis.value.title))
            print('\tanalysis ' + analysis.value.title)
            experiment_map['fedora_mapping']['generated'].append('Analysis: {}'.format(analysis.value.title))

            analysis_map = {
                'uuid': analysis.uuid,
                'fileObjs': analysis.fileObjs,
                'container_path': analysis_container_path,
                'fedora_mapping': {**format_analysis(analysis), 'wasGeneratedBy': 'Experiment: {}'.format(exp_doi)}

            }
            relation_map.append(analysis_map)

        model_configs = filter(
            lambda model_config: expt.uuid in model_config.value.experiments,
            getattr(doc, 'modelConfigs', []))
        for mc in model_configs:
            # Do stuff with model config.
            configs_container_path = "{}/{}".format(expt_container_path, parse.quote(mc.value.title))
            print('\tmodel config ' + mc.value.title)
            experiment_map['fedora_mapping']['generated'].append('Model Configuration: {}'.format(mc.value.title))

            mc_map = {
                'uuid': mc.uuid,
                'fileObjs': mc.fileObjs,
                'container_path': configs_container_path,
                'fedora_mapping': {**format_model_config(mc), 'wasGeneratedBy': exp_doi}
            }

            sensor_lists = filter(
                lambda sensor_list: mc.uuid in sensor_list.value.modelConfigs and expt.uuid in sensor_list.associationIds,
                getattr(doc, 'sensorLists', []))
            for sl in sensor_lists:
                # Do stuff with sensor list.
                sl_container_path = "{}/{}".format(configs_container_path, parse.quote(sl.value.title))
                print('\t\tsensor list ' + sl.value.title)
                experiment_map['fedora_mapping']['generated'].append('Sensor: {}'.format(sl.value.title))

                sl_map = {
                    'uuid': sl.uuid,
                    'fileObjs': sl.fileObjs,
                    'container_path': sl_container_path,
                    'fedora_mapping': {**format_sensor_info(sl),
                                       'wasGeneratedBy': 'Experiment: {}'.format(exp_doi),
                                       'wasDerivedFrom': 'Model Configuration: {}'.format(mc.value.title),
                                       'influenced': []}
                }

                events = filter(
                    lambda event: sl.uuid in event.value.sensorLists and expt.uuid in event.associationIds and mc.uuid in event.associationIds,
                    getattr(doc, 'eventsList', []))
                for event in events:
                    # Do stuff with events.
                    evt_container_path = "{}/{}".format(sl_container_path, parse.quote(event.value.title))
                    print('\t\t\tevent ' + event.value.title)
                    sl_map['fedora_mapping']['influenced'].append('Event: {}'.format(event.value.title))
                    experiment_map['fedora_mapping']['generated'].append('Event: {}'.format(event.value.title))

                    event_map = {
                        'uuid': event.uuid,
                        'fileObjs': event.fileObjs,
                        'container_path': evt_container_path,
                        'fedora_mapping': {**format_event(event),
                                           'wasGeneratedBy': 'Experiment: {}'.format(exp_doi),
                                           'wasDerivedFrom': 'Model Configuration: {}'.format(mc.value.title),
                                           'wasInfluencedBy': 'Sensor: {}'.format(sl.value.title)}
                    }
                    relation_map.append(event_map)
                relation_map.append(sl_map)
            relation_map.append(mc_map)
        relation_map.append(experiment_map)
    project_map['fedora_mapping']['creator'] = list(set(full_author_list))
    relation_map.append(project_map)

    return relation_map[::-1]


def format_experiment(expt):
    """
    Map experiment to Datacite fields for Fedora.
    """
    meta = expt.value
    equipment_type = meta.equipmentType
    if equipment_type == 'other':
        equipment_type = getattr(meta, 'equipmentTypeOther', 'other')
    experiment_type = meta.experimentType
    if experiment_type == 'other':
        experiment_type = getattr(meta, 'experimentTypeOther', 'other')
    experimental_facility = meta.experimentalFacility
    if experimental_facility == 'other':
        experimental_facility = getattr(meta, 'experimentalFacilityOther', 'other')

    publication_date = expt.created.isoformat()

    try:
        start_date = meta.procedureStart
    except AttributeError:
        start_date = None

    try:
        authors = expt.authors
        creator = list(map(lambda author: "{lname}, {fname}".format(**author.to_dict()), authors))
    except AttributeError:
        creator = list(map(lambda username: _get_user_by_username(expt, username), meta.authors))

    try:
        dois = list(meta.dois)
    except AttributeError:
        dois = [expt.doi]

    return {
        'type': experiment_type,
        'identifier': dois + [expt.uuid],
        'contributor': experimental_facility,
        'creator': creator,
        'title': meta.title,
        'description': meta.description,
        'subject': equipment_type,
        '_created': start_date,
        'available': publication_date,
        'publisher': 'Designsafe',
    }


def format_report(report):
    return {
        'type': 'report',
        'title': report.value.title,
        'identifier': report.uuid,
        'description': report.value.description,
    }


def format_model_config(mc):
    return {
        'type': 'model configuration',
        'title': mc.value.title,
        'identifier': mc.uuid,
        'description': mc.value.description
    }


def format_sensor_info(si):
    return {
        'type': 'sensor information',
        'title': si.value.title,
        'identifier': si.uuid,
        'description': si.value.description
    }


def format_event(event):
    return {
        'type': 'event',
        'title': event.value.title,
        'identifier': event.uuid,
        'description': event.value.description
    }


def format_analysis(analysis):
    return {
        'type': 'analysis',
        'title': analysis.value.title,
        'identifier': analysis.uuid,
        'description': analysis.value.description
    }


def ingest_project_experimental(project_id, upload_files=False, version=None):
    """
    Ingest a project into Fedora by creating a record in the repo, updating it
    with the published metadata, and uploading its files.
    """
    container_path = project_id

    walk_result = walk_experimental(project_id)
    # Sort by length of container path to prevent children from being ingested before their parents
    # sorted_keys = sorted(walk_result.keys(), key=lambda x: len(walk_result[x]['container_path'][0].split('/')))
    for entity in walk_result:
        fedora_post(entity['container_path'])
        print(entity['fedora_mapping'])
        res = fedora_update(entity['container_path'], entity['fedora_mapping'])
        # ingest_entity_files(project_id, container_path, entity['fileObjs'])


def get_sha1_hash(file_path):
    hash = hashlib.sha1()
    with open(file_path, 'rb') as f:
        while True:
            data = f.read(2**20)
            if not data:
                break
            hash.update(data)
    return hash.hexdigest()


def get_child_paths(dir_path):
    for root, _, files in os.walk(dir_path):
        for file in files:
            yield os.path.join(root, file)


def generate_manifest(project_id):
    walk_result = walk_experimental(project_id)
    manifest = []
    archive_path = os.path.join(PUBLICATIONS_MOUNT_ROOT, project_id)
    for entity in walk_result:
        fileObjs = entity['fileObjs']
        for file in fileObjs:

            file_path = os.path.join(archive_path, file['path'].strip('/'))
            rel_path = os.path.join(parse.unquote(entity['container_path']), file['path'].strip('/'))

            if file['type'] == 'dir':
                for path in get_child_paths(file_path):
                    manifest.append({
                        'parent_entity': entity['uuid'],
                        'corral_path': path,
                        'rel_path': path.replace(file_path, rel_path, 1),
                        'checksum': get_sha1_hash(path)
                    })

            else:
                manifest.append({
                    'parent_entity': entity['uuid'],
                    'corral_path': file_path,
                    'rel_path': rel_path,
                    'checksum': get_sha1_hash(file_path)
                })

    return manifest

def generate_package(project_id):
    from zipfile import ZipFile
    archive_path = '/corral-repl/tacc/NHERI/published/archives/{}.zip'.format(project_id)
    manifest = generate_manifest(project_id)
    manifest_json = json.dumps(manifest, indent=4)

    report = generate_report_experimental(project_id)
    report_json = json.dumps(report, indent=4)

    with ZipFile(archive_path, 'w') as zf:
        for file in manifest:
            print(file['rel_path'])
            zf.write(file['corral_path'], file['rel_path'])
        zf.writestr('{}/manifest.json'.format(project_id), manifest_json)
        zf.writestr('{}/metadata.json'.format(project_id), report_json)


def generate_report_experimental(project_id):
    from collections import deque
    report_json = []

    project_root = fedora_get(project_id)
    entity_queue = deque([project_root['@id']])

    # Depth-first search on the entity tree
    while len(entity_queue) > 0:
        entity = entity_queue.pop()
        print(entity)
        entity_json = fedora_get(entity, relative_to_root=False)
        # remove fedora-specicic meta- bypassAdmin etc
        for key in ['@context', 'created', 'createdBy', 'lastModified', 'lastModifiedBy']:
            del entity_json[key]
        report_json.append(entity_json)

        children = entity_json.get('contains', [])
        if type(children) == str:
            children = [children]

        for child in children:
            entity_queue.append(child)

    return report_json
