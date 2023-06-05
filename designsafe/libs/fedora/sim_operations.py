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
from designsafe.apps.api.publications.operations import _get_user_by_username
from designsafe.libs.fedora.fedora_operations import format_metadata_for_fedora, fedora_post, fedora_update, create_fc_version, upload_manifest, generate_manifest
import logging
logger = logging.getLogger(__name__)


def walk_sim(project_id, version=None):
    from urllib import parse
    doc = IndexedPublication.from_id(project_id, revision=version)

    relation_map = []
    full_author_list = []

    project_meta = format_metadata_for_fedora(project_id, version=version)
    if version:
        project_id = '{}v{}'.format(project_id, str(version))
    license = project_meta.get('license', None)
    print(project_id)

    project_map = {
        'uuid': doc.project.uuid,
        'container_path': project_id,
        'fedora_mapping': {**project_meta, 'generated': [], 'license': None},
        'fileObjs': []
    }

    sims_list = doc.simulations
    for sim in sims_list:
        # Do stuff with experiment.
        sim_container_path = "{}/{}".format(project_id, parse.quote(sim.value.title))
        print('simulation ' + sim.value.title)
        sim_doi = sim.doi
        project_map['fedora_mapping']['generated'].append('Experiment: {}'.format(sim_doi))

        sim_map = {
            'uuid': sim.uuid,
            'container_path': sim_container_path,
            'fedora_mapping': {**format_sim(sim), 'license': license, 'wasGeneratedBy': project_id, 'generated': []},
            'fileObjs': getattr(sim, 'fileObjs', [])
        }

        full_author_list += sim_map['fedora_mapping']['creator']


        reports = filter(
            lambda report: sim.uuid in report.value.simulations,
            getattr(doc, 'reports', []))
        for report in reports:
            # Do stuff with report.
            report_container_path = "{}/{}".format(sim_container_path, parse.quote(report.value.title))
            print('\treport ' + report.value.title)
            sim_map['fedora_mapping']['generated'].append('Report: {}'.format(report.value.title))

            report_map = {
                'uuid': report.uuid,
                'fileObjs': report.fileObjs,
                'container_path': report_container_path,
                'fedora_mapping': {**format_report(report), 'wasGeneratedBy': 'Simulation: {}'.format(sim_doi)}
            }
            relation_map.append(report_map)

        
        analysis_list = filter(
            lambda analysis: sim.uuid in analysis.value.simulations,
            getattr(doc, 'analysiss', []))
        for analysis in analysis_list:
            # Do stuff with report.
            analysis_container_path = "{}/{}".format(sim_container_path, parse.quote(analysis.value.title))
            print('\tanalysis ' + analysis.value.title)
            sim_map['fedora_mapping']['generated'].append('Analysis: {}'.format(analysis.value.title))

            analysis_map = {
                'uuid': analysis.uuid,
                'fileObjs': analysis.fileObjs,
                'container_path': analysis_container_path,
                'fedora_mapping': {**format_analysis(analysis), 'wasGeneratedBy': 'Simulation: {}'.format(sim_doi)}
            }
            relation_map.append(analysis_map)


        models = filter(
            lambda model: sim.uuid in model.value.simulations,
            getattr(doc, 'models', [])
        )
        for model in models:
            # Do stuff with model.
            model_container_path = "{}/{}".format(sim_container_path, parse.quote(model.value.title))
            print('\tmodel ' + model.value.title)
            sim_map['fedora_mapping']['generated'].append('Simulation Model: {}'.format(model.value.title))

            model_map = {
                'uuid': model.uuid,
                'fileObjs': model.fileObjs,
                'container_path': model_container_path,
                'fedora_mapping': {**format_model(model), 'wasGeneratedBy': 'Simulation: {}'.format(sim_doi)}
            }

            inputs = filter(
            lambda input: model.uuid in input.value.modelConfigs,
            getattr(doc, 'inputs', [])
            )

            for input in inputs:
                input_container_path = "{}/{}".format(model_container_path, parse.quote(input.value.title))
                print('\t\tinput ' + input.value.title)
                sim_map['fedora_mapping']['generated'].append('Simulation Input: {}'.format(input.value.title))
                input_map = {
                    'uuid': input.uuid,
                    'fileObjs': input.fileObjs,
                    'container_path': input_container_path,
                    'fedora_mapping': {**format_input(input), 
                                       'wasGeneratedBy': 'Simulation: {}'.format(sim_doi), 
                                       'wasDerivedFrom': 'Simulation Model: {}'.format(model.value.title),
                                       'wasInfluencedBy': []}
                }

                outputs = filter(
                lambda output: input.uuid in output.value.simInputs,
                getattr(doc, 'outputs', [])
                ) 

                for output in outputs:
                    output_container_path = "{}/{}".format(input_container_path, parse.quote(output.value.title))
                    print('\t\t\toutput ' + output.value.title)
                    sim_map['fedora_mapping']['generated'].append('Simulation Input: {}'.format(output.value.title))
                    input_map['fedora_mapping']['wasInfluencedBy'].append('Simulation Output: {}'.format(output.value.title))
                    output_map = {
                        'uuid': output.uuid,
                        'fileObjs': output.fileObjs,
                        'container_path': output_container_path,
                        'fedora_mapping': {**format_output(output), 
                                        'wasGeneratedBy': 'Simulation: {}'.format(sim_doi), 
                                        'wasDerivedFrom': ['Simulation Model: {}'.format(model.value.title), 'Simulation Input: {}'.format(input.value.title)],
                                        }
                    }

                    relation_map.append(output_map)

                relation_map.append(input_map)

            relation_map.append(model_map)

        relation_map.append(sim_map)

    project_map['fedora_mapping']['creator'] = list(set(full_author_list))
    relation_map.append(project_map)
    return relation_map[::-1]


def format_sim(sim):
    """
    Map experiment to Datacite fields for Fedora.
    """
    meta = sim.value

    sim_type = meta.simulationType
    if sim_type == 'other':
        sim_type = getattr(meta, 'simulationTypeOther', 'other')


    publication_date = str(sim.created)

    try:
        authors = sim.authors
        creator = list(map(lambda author: "{lname}, {fname}".format(**author.to_dict()), authors))
    except AttributeError:
        creator = list(map(lambda username: _get_user_by_username(sim, username), meta.authors))

    try:
        dois = list(meta.dois)
    except AttributeError:
        dois = [sim.doi]

    
    referenced_by = []
    part_of = []
    references = []

    refs = getattr(meta, 'referencedData', [])
    for ref in refs:
        if ref['hrefType'] == 'URL':
            ref_val = f"{ref['title']} ({ref['doi']})"
        elif ref['hrefType'] == 'DOI':
            ref_val = ref['doi']
        references.append(ref_val)


    related_work = getattr(meta, 'relatedWork', [])
    for work in related_work:
        if work['hrefType'] == 'URL':
            work_val = f"{work['title']} ({work['href']})"
        elif work['hrefType'] == 'DOI':
            work_val = work['href']

        if work['type'] == 'Linked Project':
            part_of.append(work_val)
        
        if work['type'] == 'Linked Dataset':
            part_of.append(work_val)

        if work['type'] == 'Context':
            references.append(work_val)

        if work['type'] == 'Cited By':
            referenced_by.append(work_val)




    return {
        'type': sim_type,
        'identifier': dois + [sim.uuid],
        'creator': creator,
        'title': meta.title,
        'description': meta.description,
        'available': publication_date,
        'publisher': 'Designsafe',
        'isReferencedBy': referenced_by,
        'isPartOf': part_of,
        'references': references
    }


def format_report(report):
    return {
        'type': 'report',
        'title': report.value.title,
        'description': report.value.description,
        'tags': getattr(report.value, 'tags', [])
    }

def format_analysis(analysis):
    return {
        'type': 'analysis',
        'title': analysis.value.title,
        'description': analysis.value.description,
        'tags': getattr(analysis.value, 'tags', [])
    }

def format_model(model):
    return {
        'type': 'simulation model',
        'title': model.value.title,
        'description': model.value.description,
        'tags': getattr(model.value, 'tags', [])
    }

def format_input(input):
    return {
        'type': 'simulation input',
        'title': input.value.title,
        'description': input.value.description,
        'tags': getattr(input.value, 'tags', [])
    }

def format_output(output):
    return {
        'type': 'simulation output',
        'title': output.value.title,
        'description': output.value.description,
        'tags': getattr(output.value, 'tags', [])
    }


def generate_manifest_sim(project_id, version=None):
    walk_result = walk_sim(project_id, version=version)
    return generate_manifest(walk_result, project_id, version)


def upload_manifest_sim(project_id, version=None):
    manifest_dict = generate_manifest_sim(project_id, version=version)
    return upload_manifest(manifest_dict, project_id, version)


def ingest_project_sim(project_id, version=None, amend=False):
    """
    Ingest a project into Fedora by creating a record in the repo, updating it
    with the published metadata, and uploading its files.
    """
    container_path = project_id
    if version:
        container_path = '{}v{}'.format(container_path, str(version))

    walk_result = walk_sim(project_id, version=version)
    for entity in walk_result:
        if amend:
            create_fc_version(entity['container_path'])
        fedora_post(entity['container_path'])
        fedora_update(entity['container_path'], entity['fedora_mapping'])

    if not amend:
        upload_manifest_sim(project_id, version=version)
