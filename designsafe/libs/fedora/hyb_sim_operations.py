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
from designsafe.libs.fedora.fedora_operations import format_metadata_for_fedora, fedora_post, fedora_update, create_fc_version, upload_manifest, generate_manifest, has_associations
import logging
logger = logging.getLogger(__name__)


def walk_hyb_sim(project_id, version=None):
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
    doc = IndexedPublication.from_id(project_id, revision=version)

    relation_map = []

    project_meta = format_metadata_for_fedora(project_id, version=version)
    if version:
        project_id = '{}v{}'.format(project_id, str(version))
    license = project_meta.get('license', None)

    project_map = {
        'uuid': doc.project.uuid,
        'container_path': project_id,
        'fedora_mapping': {**project_meta, 'generated': [], 'license': None},
        'fileObjs': [],
        'fileTags': []
    }

    hybrid_sim_list = getattr(doc, 'hybrid_simulations', [])
    for hyb_sim in hybrid_sim_list:
        # Do stuff with hyb sim.
        hyb_sim_container_path = "{}/{}".format(project_id, parse.quote(hyb_sim.value.title))
        print('hybrid sim ' + hyb_sim.value.title)
        hyb_sim_doi = hyb_sim.doi
        project_map['fedora_mapping']['generated'].append('Hybrid Simulation: {}'.format(hyb_sim_doi))

        hyb_sim_map = {
            'uuid': hyb_sim.uuid,
            'container_path': hyb_sim_container_path,
            'fedora_mapping': {**format_hyb_sim(hyb_sim), 'license': license, 'wasGeneratedBy': project_id, 'generated': [], 'hasVersion': version},
            'fileObjs': [],
            'fileTags': []
        }

        reports_list = filter(
                lambda report: hyb_sim.uuid in report.value.hybridSimulations,
                getattr(doc, 'reports', []))
        for report in reports_list:
            # Do stuff with report.
            report_container_path = "{}/{}".format(project_id, parse.quote(report.value.title))
            print('\treport ' + report.value.title)
            project_map['fedora_mapping']['generated'].append('Report: {}'.format(report.value.title))

            report_map = {
                'uuid': report.uuid,
                'container_path': report_container_path,
                'fedora_mapping': {**format_report(report), 'wasGeneratedBy': 'Hybrid Simulation: {}'.format(hyb_sim_doi)},
                'fileObjs': report.fileObjs,
                'fileTags': getattr(report.value, 'fileTags', [])
            }

            relation_map.append(report_map)

        analysis_list = filter(
                lambda analysis: hyb_sim.uuid in analysis.value.hybridSimulations,
                getattr(doc, 'analysiss', []))
        for analysis in analysis_list:
            # Do stuff with analysis.
            analysis_container_path = "{}/{}".format(project_id, parse.quote(analysis.value.title))
            print('analysis ' + analysis.value.title)
            project_map['fedora_mapping']['generated'].append('Analysis: {}'.format(analysis.value.title))

            analysis_map = {
                'uuid': report.uuid,
                'container_path': analysis_container_path,
                'fedora_mapping': {**format_report(analysis), 'wasGeneratedBy': 'Hybrid Simulation: {}'.format(hyb_sim_doi)},
                'fileObjs': analysis.fileObjs,
                'fileTags': getattr(analysis.value, 'fileTags', [])
            }

            relation_map.append(analysis_map)

        global_model_list = filter(
            lambda global_model: hyb_sim.uuid in global_model.value.hybridSimulations,
            getattr(doc, 'global_models', []))
        for global_model in global_model_list:
            # Do stuff with global model.
            global_model_container_path = "{}/{}".format(hyb_sim_container_path, parse.quote(global_model.value.title))
            print('\tGlobal Model ' + global_model.value.title)
            hyb_sim_map['fedora_mapping']['generated'].append('Global Model: {}'.format(global_model.value.title))

            global_model_map = {
                'uuid': global_model.uuid,
                'fileObjs': global_model.fileObjs,
                'fileTags': getattr(global_model.value, 'fileTags', []),
                'container_path': global_model_container_path,
                'fedora_mapping': {**format_global_modal(global_model), 'wasGeneratedBy': 'Hybrid Simulation: {}'.format(hyb_sim_doi)}
            }

            coordinator_list = filter(
                lambda coordinator: global_model.uuid in coordinator.value.globalModels and has_associations(coordinator, [global_model, hyb_sim]),
                getattr(doc, 'coordinators', []))
            for coordinator in coordinator_list:
                # Do stuff with coordinator.
                coordinator_container_path = "{}/{}".format(global_model_container_path, parse.quote(coordinator.value.title))
                print('\t\tCoordinator ' + coordinator.value.title)
                hyb_sim_map['fedora_mapping']['generated'].append('Coordinator: {}'.format(coordinator.value.title))

                coordinator_map = {
                    'uuid': coordinator.uuid,
                    'fileObjs': coordinator.fileObjs,
                    'fileTags': getattr(coordinator.value, 'fileTags', []),
                    'container_path': coordinator_container_path,
                    'fedora_mapping': {**format_coordinator(coordinator), 'wasGeneratedBy': 'Hybrid Simulation: {}'.format(hyb_sim_doi), 
                                                                          'wasInfluencedBy': 'Global Model: {}'.format(global_model.value.title)}
                }

                coordinator_output_list = filter(
                    lambda coordinator_output: coordinator.uuid in coordinator_output.value.coordinators and has_associations(coordinator_output, [hyb_sim, global_model, coordinator]),
                    getattr(doc, 'coordinator_outputs', []))
                for coordinator_output in coordinator_output_list:
                    # Do stuff with coordinator output.
                    coordinator_output_container_path = "{}/{}".format(coordinator_container_path, parse.quote(coordinator_output.value.title))
                    print('\t\t\tCoordinator Output ' + coordinator_output.value.title)
                    hyb_sim_map['fedora_mapping']['generated'].append('Coordinator Output: {}'.format(coordinator_output.value.title))

                    coordinator_output_map = {
                        'uuid': coordinator_output.uuid,
                        'fileObjs': coordinator_output.fileObjs,
                        'fileTags': getattr(coordinator_output.value, 'fileTags', []),
                        'container_path': coordinator_output_container_path,
                        'fedora_mapping': {**format_coordinator_output(coordinator_output), 'wasGeneratedBy': 'Hybrid Simulation: {}'.format(hyb_sim_doi), 
                                                                              'wasInfluencedBy': 'Global Model: {}'.format(global_model.value.title),
                                                                              'wasDerivedFrom': 'Coordinator: {}'.format(coordinator.value.title)}
                    }
                    relation_map.append(coordinator_output_map)


                sim_sub_list = filter(
                    lambda sim_sub: coordinator.uuid in sim_sub.value.coordinators and has_associations(sim_sub, [hyb_sim, global_model, coordinator]),
                    getattr(doc, 'sim_substructures', []))
                for sim_sub in sim_sub_list:
                    # Do stuff with sim substructure.
                    sim_sub_container_path = "{}/{}".format(coordinator_container_path, parse.quote(sim_sub.value.title))
                    print('\t\t\tSimulation Substructure ' + sim_sub.value.title)
                    hyb_sim_map['fedora_mapping']['generated'].append('Simulation Substructure: {}'.format(sim_sub.value.title))

                    sim_sub_map = {
                        'uuid': sim_sub.uuid,
                        'fileObjs': sim_sub.fileObjs,
                        'fileTags': getattr(sim_sub.value, 'fileTags', []),
                        'container_path': sim_sub_container_path,
                        'fedora_mapping': {**format_sim_substructure(sim_sub), 'wasGeneratedBy': 'Hybrid Simulation: {}'.format(hyb_sim_doi), 
                                                                               'wasInfluencedBy': 'Global Model: {}'.format(global_model.value.title),
                                                                               'wasInfluencedBy': 'Coordinator: {}'.format(coordinator.value.title)}
                    }

                    sim_out_list = filter(
                        lambda sim_out: sim_sub.uuid in sim_out.value.simSubstructures and has_associations(sim_out, [hyb_sim, global_model]),
                        getattr(doc, 'sim_outputs', []))
                    for sim_out in sim_out_list:
                        # Do stuff with sim output.
                        sim_out_container_path = "{}/{}".format(sim_sub_container_path, parse.quote(sim_out.value.title))
                        print('\t\t\t\tSimulation Output ' + sim_out.value.title)
                        hyb_sim_map['fedora_mapping']['generated'].append('Simulation Output: {}'.format(sim_sub.value.title))

                        sim_out_map = {
                            'uuid': sim_out.uuid,
                            'fileObjs': sim_out.fileObjs,
                            'fileTags': getattr(sim_out.value, 'fileTags', []),
                            'container_path': sim_out_container_path,
                            'fedora_mapping': {**format_sim_output(sim_out), 'wasDerivedFrom': 'Simulation Substructure: {}'.format(sim_sub.value.title)}
                        }
                        relation_map.append(sim_out_map)

                    relation_map.append(sim_sub_map)

                exp_sub_list = filter(
                    lambda exp_sub: coordinator.uuid in exp_sub.value.coordinators and has_associations(exp_sub, [hyb_sim, global_model]),
                    getattr(doc, 'exp_substructures', []))
                for exp_sub in exp_sub_list:
                    # Do stuff with experimental substructure.
                    exp_sub_container_path = "{}/{}".format(coordinator_container_path, parse.quote(exp_sub.value.title))
                    print('\t\t\tExperimental Substructure ' + exp_sub.value.title)
                    hyb_sim_map['fedora_mapping']['generated'].append('Experimental Substructure: {}'.format(exp_sub.value.title))

                    exp_sub_map = {
                        'uuid': exp_sub.uuid,
                        'fileObjs': exp_sub.fileObjs,
                        'fileTags': getattr(exp_sub.value, 'fileTags', []),
                        'container_path': exp_sub_container_path,
                        'fedora_mapping': {**format_exp_substructure(exp_sub), 'wasGeneratedBy': 'Hybrid Simulation: {}'.format(hyb_sim_doi), 
                                                                            'wasInfluencedBy': 'Global Model: {}'.format(global_model.value.title),
                                                                            'wasInfluencedBy': 'Coordinator: {}'.format(coordinator.value.title)}
                    }

                    exp_out_list = filter(
                        lambda exp_out: exp_sub.uuid in exp_out.value.expSubstructures and has_associations(exp_out, [hyb_sim, global_model]),
                        getattr(doc, 'exp_outputs', []))
                    for exp_out in exp_out_list:
                        # Do stuff with experimental output.
                        exp_out_container_path = "{}/{}".format(exp_sub_container_path, parse.quote(exp_out.value.title))
                        print('\t\t\t\tExperimental Output ' + exp_out.value.title)
                        hyb_sim_map['fedora_mapping']['generated'].append('Experimental Output: {}'.format(exp_sub.value.title))

                        exp_out_map = {
                            'uuid': exp_out.uuid,
                            'fileObjs': exp_out.fileObjs,
                            'fileTags': getattr(exp_out.value, 'fileTags', []),
                            'container_path': exp_out_container_path,
                            'fedora_mapping': {**format_exp_output(exp_out), 'wasDerivedFrom': 'Experimental Substructure: {}'.format(exp_sub.value.title)}
                        }
                        relation_map.append(exp_out_map)

                    relation_map.append(exp_sub_map)

                relation_map.append(coordinator_map)
            relation_map.append(global_model_map)

        relation_map.append(hyb_sim_map)
    # project_map['fedora_mapping']['creator'] = list(set(full_author_list))
    relation_map.append(project_map)

    return relation_map[::-1]


def format_hyb_sim(hyb_sim):
    """
    Map hybrid sim to Datacite fields for Fedora.
    """
    meta = hyb_sim.value

    facility = getattr(meta, 'facility', {}).get('name', None)

    try:
        authors = hyb_sim.authors
        creator = list(map(lambda author: "{lname}, {fname}".format(**author.to_dict()), authors))
    except AttributeError:
        creator = list(map(lambda username: _get_user_by_username(hyb_sim, username), meta.authors))

    try:
        dois = list(hyb_sim.dois)
    except AttributeError:
        dois = [hyb_sim.doi]

    publication_date = str(hyb_sim.created)

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
        "title": meta.title,
        "type": meta.simulationType,
        "creator": creator,
        "identifier": dois,
        'contributor': facility,
        "available": publication_date,
        "publisher": "DesignSafe",
        "description": meta.description,
        'isReferencedBy': referenced_by,
        'isPartOf': part_of,
        'references': references

    }

def format_global_modal(global_model):
    return {
        "type": "global model",
        "title": global_model.value.title,
        "abstract": global_model.value.description,
    }

def format_coordinator(coordinator):
    return {
        "type": "simulation coordinator",
        "title": coordinator.value.title,
        "description": coordinator.value.description
    }

def format_sim_substructure(sim_sub):
    return {
        "type": "simulation substructure",
        "title": sim_sub.value.title,
        "abstract": sim_sub.value.description
    }

def format_sim_output(sim_out):
    return {
        "type": "simulation output",
        "title": sim_out.value.title,
        "abstract": sim_out.value.description
    }

def format_exp_substructure(exp_sub):
    return {
        "type": "experimental substructure",
        "title": exp_sub.value.title,
        "description": exp_sub.value.description
    }

def format_exp_output(exp_out):
    return {
        "type": "experimental output",
        "title": exp_out.value.title,
        "description": exp_out.value.description
    }

def format_coordinator_output(coord_out):
    return {
        "type": "coordinator output",
        "title": coord_out.value.title,
        "abstract": coord_out.value.description
    }

def format_analysis(analysis):
    return {
        "type": "analysis",
        "title": analysis.value.title,
        "description": analysis.value.description
    }


def format_report(report):
    return {
        "type": "report",
        "title": report.value.title,
        "description": report.value.description
    }


def format_member(member):
    try:
        return f'{member.lname}, {member.fname}'
    except AttributeError:
        user_obj = get_user_model().objects.get(username=member.name)
        return "{}, {}".format(user_obj.last_name, user_obj.first_name)





def generate_manifest_hyb_sim(project_id, version=None):
    walk_result = walk_hyb_sim(project_id, version=version)
    return generate_manifest(walk_result, project_id, version)


def upload_manifest_hyb_sim(project_id, version=None):
    manifest_dict = generate_manifest_hyb_sim(project_id, version=version)
    return upload_manifest(manifest_dict, project_id, version)


def ingest_project_hyb_sim(project_id, version=None, amend=False):
    """
    Ingest a project into Fedora by creating a record in the repo, updating it
    with the published metadata, and uploading its files.
    """
    container_path = project_id
    if version:
        container_path = '{}v{}'.format(container_path, str(version))

    walk_result = walk_hyb_sim(project_id, version=version)
    for entity in walk_result:
        if amend:
            create_fc_version(entity['container_path'])
        fedora_post(entity['container_path'])
        fedora_update(entity['container_path'], entity['fedora_mapping'])

    if not amend:
        upload_manifest_hyb_sim(project_id, version=version)