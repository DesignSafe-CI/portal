import requests
from requests import HTTPError
from django.conf import settings
import json
from designsafe.apps.data.models.elasticsearch import IndexedPublication
from designsafe.apps.api.publications.operations import _get_user_by_username

FEDORA_HEADERS = {
    'accept': 'application/ld+json;profile="http://www.w3.org/ns/json-ld#compacted"',
    'content-type': 'application/ld+json'
}

PUBLICATIONS_CONTAINER = 'publications-test'

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


def fedora_post(container_path):
    """"
    Create a Fedora container for a project if none exists; otherwise, return
    existing metadata for that project.

    Params
    ------
    project_id: Project ID to look up (e.g. PRJ-1234)

    Returns
    -------
    dict: Publication metadata in compact JSON format.
    """
    try:
        request = requests.put('{}{}/{}'.format(settings.FEDORA_URL,
                                                PUBLICATIONS_CONTAINER, container_path),
                               auth=(settings.FEDORA_USERNAME,
                                     settings.FEDORA_PASSWORD))
        request.raise_for_status()
    except HTTPError as error:
        if error.response.status_code == 409:
            return fedora_get(container_path)
        raise error


def fedora_update(project_id, update_body={}):
    initial_data = fedora_get(project_id)
    updated_data = {**initial_data, **update_body}
    updated_data['@context'] = {**initial_data['@context'], **FEDORA_CONTEXT}

    request = requests.put('{}{}/{}'.format(settings.FEDORA_URL,
                                            PUBLICATIONS_CONTAINER, project_id),
                           auth=(settings.FEDORA_USERNAME,
                                 settings.FEDORA_PASSWORD),
                           headers=FEDORA_HEADERS,
                           data=json.dumps(updated_data))
    request.raise_for_status()
    return fedora_get(project_id)


def format_metadata_for_fedora(project_id, version=None):
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
        'type': getattr(pub_meta, 'dataType', None),
        'publisher': 'Designsafe'
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


def ingest_project(project_id):
    fedora_post(project_id)
    project_meta = format_metadata_for_fedora(project_id)
    res = fedora_update(project_id, project_meta)
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

def format_experiment_metadata(project_id):
    doc = IndexedPublication.from_id(project_id)

