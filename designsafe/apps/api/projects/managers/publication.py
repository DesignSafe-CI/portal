import re
import logging
import codecs
import xml.etree.ElementTree as ET
from xml.dom import minidom
from django.contrib.auth import get_user_model
from django.conf import settings
import datetime
import dateutil.parser
import requests
import chardet

from django.core.exceptions import ObjectDoesNotExist
from pytas.http import TASClient

from designsafe.apps.api.agave import service_account
from designsafe.apps.projects.models.agave.base import Project as BaseProject
from designsafe.apps.projects.models.agave.experimental import (
    ExperimentalProject,
    Experiment,
    Event,
    ModelConfig,
    SensorList,
    Report,
    Analysis
)
from designsafe.apps.projects.models.agave.simulation import (
    SimulationProject,
    Simulation,
    Model as SimModel,
    Input as SimInput,
    Output as SimOutput,
    Analysis as SimAnalysis,
    Report as SimReport
)
from designsafe.apps.projects.models.agave.hybrid_simulation import (
    HybridSimulationProject,
    HybridSimulation,
    GlobalModel,
    Coordinator,
    SimSubstructure,
    ExpSubstructure,
    CoordinatorOutput,
    SimOutput as HybridSimOutput,
    ExpOutput,
    Analysis as HybridAnalysis,
    Report as HybridReport
)
from designsafe.apps.projects.models.agave.rapid import (
    FieldReconProject,
    Mission,
    Collection,
    Report as FieldReconReport
)


logger = logging.getLogger(__name__)

USER = settings.DATACITE_USER
PASSWORD = settings.DATACITE_PASS
CREDS = (USER, PASSWORD)
BASE_URI = settings.DATACITE_URI
FAKE_SHOULDER = 'doi:10.5072/FK2' 
SHOULDER = settings.DATACITE_SHOULDER or FAKE_SHOULDER
TARGET_BASE = 'https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{project_id}'
ENTITY_TARGET_BASE = 'https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{project_id}/#details-{entity_uuid}'
logger.debug('Using shoulder: %s', SHOULDER)

def pretty_print(xml):
    """Return a pretty-printed XML string for the Element.
    """
    rough_string = ET.tostring(xml, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")

def _project_header():
    xml_obj = ET.Element("resource")
    xml_obj.attrib["xmlns:xsi"] = "http://www.w3.org/2001/XMLSchema-instance"
    xml_obj.attrib["xmlns"] = "http://datacite.org/schema/kernel-4"
    xml_obj.attrib["xsi:schemaLocation"] = "http://datacite.org/schema/kernel-4 http://schema.datacite.org/meta/kernel-4/metadata.xsd"
    return xml_obj

def _unescape(s):
    return re.sub("%([0-9A-Fa-f][0-9A-Fa-f])",
                  lambda m: chr(int(m.group(1), 16)), s)

def parse_response(res):
    response = dict(
        tuple(
            _unescape(v).strip() for v in l.split(":", 1)
        )
        for l in res.splitlines()
    )
    return response

def _escape(s, key=True):
    if key:
        return re.sub("[%:\r\n]", lambda c: "%%%02X" % ord(c.group(0)), s)
    else:
        return re.sub("[%\r\n]", lambda c: "%%%02X" % ord(c.group(0)), s)

def format_req(metadata):
    anvl = []
    for key, value in metadata.items():
        key = _escape(key)
        if value.startswith("@") and len(value) > 1:
            f = codecs.open(value[1:], encoding="UTF-8")    
            value = f.read()
            f.close()
        value = _escape(value, False)
        anvl.append("{key}: {value}".format(key=key, value=value))
    return "\n".join(anvl)

def _reserve_doi(xml_obj, target):
    xml_str = ET.tostring(xml_obj, encoding="UTF-8", method="xml")
    logger.debug(xml_str)
    metadata = {'_status': 'reserved', 'datacite': xml_str, '_target': target}

    response = requests.post('{}/shoulder/{}'.format(BASE_URI, SHOULDER),
                             data=format_req(metadata),
                             auth=CREDS,
                             headers={'Content-Type': 'text/plain'})
    res = parse_response(response.text)
    if 'success' in res:
        return res['success']
    else:
        raise Exception(res['error'])

def _update_doi(doi, xml_obj=None, status='reserved'):
    res = requests.get(
        '{}/id/{}'.format(BASE_URI, doi),
        auth=CREDS,
        headers={'Content-Type': 'text/plain'}
    )
    if status == 'reserved' and res.status_code >= 200 and res.status_code <= 202:
        status = parse_response(res.text).get('_status', status)

    if xml_obj is not None:
        xml_str = ET.tostring(xml_obj, encoding="UTF-8", method="xml")
        metadata = {'_status': status, 'datacite': xml_str}
    else:
        metadata = {'_status': status}

    if SHOULDER != FAKE_SHOULDER:
        response = requests.post(
            '{}/id/{}'.format(BASE_URI, doi),
            data=format_req(metadata),
            auth=CREDS,
            headers={'Content-Type': 'text/plain'}
        )
        res = parse_response(response.text)
        if 'success' in res:
            return res['success']
        else:
            raise Exception(res['error'])

def _project_required_xml(project, authors, created, doi=None):
    xml_obj = _project_header()

    resource = xml_obj
    identifier = ET.SubElement(resource, 'identifier')
    identifier.attrib['identifierType'] = 'DOI'
    if doi:
        identifier.text = doi
    else:
        identifier.text = SHOULDER.replace('doi:', '')
    creators = ET.SubElement(resource, 'creators')

    for author in authors:
        if not author.get('lname') and not author.get('fname'):
            logger.error('Author in wrong format: %s', author)
            continue
        creator = ET.SubElement(creators, 'creator')
        creator_name = ET.SubElement(creator, 'creatorName')
        creator_name.text = '{}, {}'.format(author['lname'], author['fname'])

    titles = ET.SubElement(resource, 'titles')
    title = ET.SubElement(titles, 'title')
    title.text = project.title
    publisher = ET.SubElement(resource, 'publisher')
    publisher.text = 'Designsafe-CI'

    now = dateutil.parser.parse(created)
    publication_year = ET.SubElement(resource, 'publicationYear')
    publication_year.text = str(now.year)

    resource_type = ET.SubElement(resource, 'resourceType')
    resource_type.text = "Project/{}".format(project.project_type.title())
    resource_type.attrib['resourceTypeGeneral'] = 'Dataset'
    descriptions = ET.SubElement(resource, 'descriptions')
    desc = ET.SubElement(descriptions, 'description')
    desc.attrib['descriptionType'] = 'Abstract'
    desc.text = project.description
    return xml_obj

def _experiment_required_xml(authors_details, experiment, created, exp_doi=None):
    xml_obj = _project_header()

    resource = xml_obj
    identifier = ET.SubElement(resource, 'identifier')
    identifier.attrib['identifierType'] = 'DOI'
    if exp_doi:
        identifier.text = exp_doi
    else:
        identifier.text = SHOULDER.replace('doi:', '')

    creators = ET.SubElement(resource, 'creators')
    for author in sorted(authors_details, key=lambda x: x['order']):
        if not author.get('authorship'):
            continue
        elif author.get('lname') and author.get('fname'):
            _author = {
                'last_name': author['lname'],
                'first_name': author['fname']
            }
        else:
            try:
                user = get_user_model().objects.get(username=author['name'])
            except ObjectDoesNotExist:
                logger.error('User does not exists: %s', author['name'])
                continue

            _author = {
                'last_name': user.last_name,
                'first_name': user.first_name
            }

        creator = ET.SubElement(creators, 'creator')
        creator_name = ET.SubElement(creator, 'creatorName')
        creator_name.text = '{}, {}'.format(_author['last_name'], _author['first_name'])

    titles = ET.SubElement(resource, 'titles')
    title = ET.SubElement(titles, 'title')
    title.text = experiment.title
    publisher = ET.SubElement(resource, 'publisher')
    publisher.text = 'Designsafe-CI'

    now = dateutil.parser.parse(created)
    publication_year = ET.SubElement(resource, 'publicationYear')
    publication_year.text = str(now.year)

    resource_type = ET.SubElement(resource, 'resourceType')
    resource_type.text = "Experiment/{}".format(experiment.experiment_type.title())
    resource_type.attrib['resourceTypeGeneral'] = 'Dataset'
    descriptions = ET.SubElement(resource, 'descriptions')
    desc = ET.SubElement(descriptions, 'description')
    desc.attrib['descriptionType'] = 'Abstract'
    desc.text = experiment.description
    return xml_obj

def _analysis_required_xml(users, analysis, created):
    anl = analysis['value']
    xml_obj = _project_header()

    resource = xml_obj
    identifier = ET.SubElement(resource, 'identifier')
    identifier.attrib['identifierType'] = 'DOI'
    identifier.text = SHOULDER.replace('doi:', '')
    creators = ET.SubElement(resource, 'creators')
    #um = get_user_model()
    users = sorted(users, key=lambda x: x['_ui']['order'])
    authors = anl.get('authors', users)
    for author in authors:
        _userf = filter(lambda x: x['username'] == author, users)
        if not len(_userf):
            continue

        _user = _userf[0]
        creator = ET.SubElement(creators, 'creator')
        creator_name = ET.SubElement(creator, 'creatorName')
        creator_name.text = '{}, {}'.format(_user['last_name'], _user['first_name'])

    titles = ET.SubElement(resource, 'titles')
    title = ET.SubElement(titles, 'title')
    title.text = anl['title']
    publisher = ET.SubElement(resource, 'publisher')
    publisher.text = 'Designsafe-CI'

    now = dateutil.parser.parse(created)
    publication_year = ET.SubElement(resource, 'publicationYear')
    publication_year.text = str(now.year)

    resource_type = ET.SubElement(resource, 'resourceType')
    resource_type.text = 'Analysis'
    resource_type.attrib['resourceTypeGeneral'] = 'Other'
    descriptions = ET.SubElement(resource, 'descriptions')
    desc = ET.SubElement(descriptions, 'description')
    desc.attrib['descriptionType'] = 'Abstract'
    desc.text = anl['description']
    return xml_obj

def _simulation_required_xml(authors_details, simulation, created, sim_doi=None):
    xml_obj = _project_header()

    resource = xml_obj
    identifier = ET.SubElement(resource, 'identifier')
    identifier.attrib['identifierType'] = 'DOI'
    if sim_doi:
        identifier.text = sim_doi
    else:
        identifier.text = SHOULDER.replace('doi:', '')

    creators = ET.SubElement(resource, 'creators')
    for author in sorted(authors_details, key=lambda x: x['order']):
        if not author.get('authorship'):
            continue
        elif author.get('lname') and author.get('fname'):
            _author = {
                'last_name': author['name'],
                'first_name': author['fname']
            }
        else:
            try:
                user = get_user_model().objects.get(username=author['name'])
            except ObjectDoesNotExist:
                logger.error('User does not exists: %s', author['name'])
                continue

            _author = {
                'last_name': user.last_name,
                'first_name': user.first_name,
            }

        creator = ET.SubElement(creators, 'creator')
        creator_name = ET.SubElement(creator, 'creatorName')
        creator_name.text = '{}, {}'.format(_author['last_name'], _author['first_name'])

    titles = ET.SubElement(resource, 'titles')
    title = ET.SubElement(titles, 'title')
    title.text = simulation.title
    publisher = ET.SubElement(resource, 'publisher')
    publisher.text = 'Designsafe-CI'

    now = dateutil.parser.parse(created)
    publication_year = ET.SubElement(resource, 'publicationYear')
    publication_year.text = str(now.year)

    resource_type = ET.SubElement(resource, 'resourceType')
    resource_type.text = "Simulation/{}".format(
            simulation.simulation_type.title())
    resource_type.attrib['resourceTypeGeneral'] = 'Dataset'
    descriptions = ET.SubElement(resource, 'descriptions')
    desc = ET.SubElement(descriptions, 'description')
    desc.attrib['descriptionType'] = 'Abstract'
    desc.text = simulation.description
    return xml_obj


def _mission_required_xml(authors_details, mission, created, mis_doi=None):
    xml_obj = _project_header()

    resource = xml_obj
    identifier = ET.SubElement(resource, 'identifier')
    identifier.attrib['identifierType'] = 'DOI'
    if mis_doi:
        identifier.text = mis_doi
    else:
        identifier.text = SHOULDER.replace('doi:', '')

    creators = ET.SubElement(resource, 'creators')
    for author in sorted(authors_details, key=lambda x: x['order']):
        if not author.get('authorship'):
            continue
        elif author.get('lname') and author.get('fname'):
            _author = {
                'last_name': author['name'],
                'first_name': author['fname']
            }
        else:
            try:
                user = get_user_model().objects.get(username=author['name'])
            except ObjectDoesNotExist:
                logger.error('User does not exists: %s', author['name'])
                continue

            _author = {
                'last_name': user.last_name,
                'first_name': user.first_name,
            }

        creator = ET.SubElement(creators, 'creator')
        creator_name = ET.SubElement(creator, 'creatorName')
        creator_name.text = '{}, {}'.format(_author['last_name'], _author['first_name'])

    titles = ET.SubElement(resource, 'titles')
    title = ET.SubElement(titles, 'title')
    title.text = mission.title
    publisher = ET.SubElement(resource, 'publisher')
    publisher.text = 'Designsafe-CI'

    now = dateutil.parser.parse(created)
    publication_year = ET.SubElement(resource, 'publicationYear')
    publication_year.text = str(now.year)

    resource_type = ET.SubElement(resource, 'resourceType')
    resource_type.text = "Mission/{}".format(
        mission.location.title())
    resource_type.attrib['resourceTypeGeneral'] = 'Dataset'
    descriptions = ET.SubElement(resource, 'descriptions')
    desc = ET.SubElement(descriptions, 'description')
    desc.attrib['descriptionType'] = 'Abstract'
    desc.text = mission.description
    return xml_obj


def experiment_reserve_xml(publication, project, experiment, authors_details=None, exp_doi=None):
    xml_obj = _experiment_required_xml(
        authors_details,
        experiment,
        publication['created'],
        exp_doi
    )
    if not exp_doi:
        reserve_res = _reserve_doi(
            xml_obj,
            ENTITY_TARGET_BASE.format(
                project_id=publication['project']['value']['projectId'],
                entity_uuid=experiment.uuid
            )
        )
        doi = reserve_res
        ark = doi
    else:
        doi = exp_doi
        ark = exp_doi

    doi = doi.strip()
    ark = ark.strip()
    identifier = xml_obj.find('identifier')
    identifier.text = doi
    resource = xml_obj
    contributors = ET.SubElement(resource, 'contributors')
    contributor = ET.SubElement(contributors, 'contributor')
    contributor.attrib['contributorType'] = 'HostingInstitution'
    name = ET.SubElement(contributor, 'contributorName')
    name.text = experiment.experimental_facility
    subjects = ET.SubElement(resource, 'subjects')
    exp_type = ET.SubElement(subjects, 'subject')
    exp_type.text = experiment.experimental_facility.title()
    eq_type = ET.SubElement(subjects, 'subject')
    eq_type.text = experiment.equipment_type

    for event_dict in publication['eventsList']:
        event = Event.manager().get(service_account(), uuid=event_dict['uuid'])
        event_subj = ET.SubElement(subjects, 'subject')
        event_subj.text = event.title
        event_dict.update(event.to_body_dict())

    for mcf_dict in publication['modelConfigs']:
        mcf = ModelConfig.manager().get(service_account(), uuid=mcf_dict['uuid'])
        mcf_subj = ET.SubElement(subjects, 'subject')
        mcf_subj.text = mcf.title
        mcf_dict.update(mcf.to_body_dict())

    for slt_dict in publication['sensorLists']:
        slt = SensorList.manager().get(service_account(), uuid=slt_dict['uuid'])
        slt_subj = ET.SubElement(subjects, 'subject')
        slt_subj.text = slt.title
        slt_dict.update(slt.to_body_dict())

    for report_dict in publication.get('reportsList', []):
        report = Report.manager().get(service_account(), uuid=report_dict['uuid'])
        report_subj = ET.SubElement(subjects, 'subject')
        report_subj.text = report.title
        report_dict.update(report.to_body_dict())

    for analysis_dict in publication.get('analysisList', []):
        analysis = Analysis.manager().get(service_account(), uuid=analysis_dict['uuid'])
        analysis_subj = ET.SubElement(subjects, 'subject')
        analysis_subj.text = analysis.title
        analysis_dict.update(analysis.to_body_dict())

    _update_doi(doi, xml_obj)
    return (doi, ark, xml_obj)


def simulation_reserve_xml(publication, project, simulation, authors_details=None, sim_doi=None):
    xml_obj = _simulation_required_xml(
        authors_details,
        simulation,
        publication['created'],
        sim_doi
    )
    if not sim_doi:
        reserve_res = _reserve_doi(
            xml_obj,
            ENTITY_TARGET_BASE.format(
                project_id=publication['project']['value']['projectId'],
                entity_uuid=simulation.uuid
            )
        )
        doi = reserve_res
        ark = doi
    else:
        doi = sim_doi
        ark = sim_doi

    doi = doi.strip()
    ark = ark.strip()
    identifier = xml_obj.find('identifier')
    identifier.text = doi
    resource = xml_obj
    subjects = ET.SubElement(resource, 'subjects')
    sim_type = ET.SubElement(subjects, 'subject')
    sim_type.text = simulation.simulation_type.title()

    for model_dict in publication['models']:
        model = SimModel.manager().get(service_account(), uuid=model_dict['uuid'])
        model_subj = ET.SubElement(subjects, 'subject')
        model_subj.text = model.title
        model_dict.update(model.to_body_dict())

    for input_dict in publication['inputs']:
        sim_input = SimInput.manager().get(service_account(), uuid=input_dict['uuid'])
        input_subj = ET.SubElement(subjects, 'subject')
        input_subj.text = sim_input.title
        input_dict.update(sim_input.to_body_dict())

    for output_dict in publication['outputs']:
        output = SimOutput.manager().get(service_account(), uuid=output_dict['uuid'])
        output_subj = ET.SubElement(subjects, 'subject')
        output_subj.text = output.title
        output_dict.update(output.to_body_dict())

    for report_dict in publication.get('reports', []):
        report = SimReport.manager().get(service_account(), uuid=report_dict['uuid'])
        report_subj = ET.SubElement(subjects, 'subject')
        report_subj.text = report.title
        report_dict.update(report.to_body_dict())

    for analysis_dict in publication.get('analysiss', []):
        analysis = SimAnalysis.manager().get(service_account(), uuid=analysis_dict['uuid'])
        analysis_subj = ET.SubElement(subjects, 'subject')
        analysis_subj.text = analysis.title
        analysis_dict.update(analysis.to_body_dict())

    _update_doi(doi, xml_obj)
    return (doi, ark, xml_obj)


def hybrid_simulation_reserve_xml(
        publication,
        project,
        hybrid_simulation,
        authors_details,
        hybrid_sim_doi
):
    xml_obj = _simulation_required_xml(
        authors_details,
        hybrid_simulation,
        publication['created'],
        hybrid_sim_doi
    )
    if not hybrid_sim_doi:
        reserve_res = _reserve_doi(
            xml_obj,
            ENTITY_TARGET_BASE.format(
                project_id=publication['project']['value']['projectId'],
                entity_uuid=hybrid_simulation.uuid
            )
        )
        doi = reserve_res
        ark = doi
    else:
        doi = hybrid_sim_doi
        ark = hybrid_sim_doi

    doi = doi.strip()
    ark = ark.strip()
    identifier = xml_obj.find('identifier')
    identifier.text = doi
    resource = xml_obj
    subjects = ET.SubElement(resource, 'subjects')
    sim_type = ET.SubElement(subjects, 'subject')
    sim_type.text = hybrid_simulation.simulation_type.title()

    for global_model_dict in publication['global_models']:
        global_model = GlobalModel.manager().get(service_account(), uuid=global_model_dict['uuid'])
        global_model_subj = ET.SubElement(subjects, 'subject')
        global_model_subj.text = global_model.title
        global_model_dict.update(global_model.to_body_dict())

    for coordinator_dict in publication['coordinators']:
        coordinator = Coordinator.manager().get(service_account(), uuid=coordinator_dict['uuid'])
        coordinator_subj = ET.SubElement(subjects, 'subject')
        coordinator_subj.text = coordinator.title
        coordinator_dict.update(coordinator.to_body_dict())

    for sim_substructure_dict in publication['sim_substructures']:
        sim_substructure = SimSubstructure.manager().get(
            service_account(),
            uuid=sim_substructure_dict['uuid']
        )
        sim_substructure_subj = ET.SubElement(subjects, 'subject')
        sim_substructure_subj.text = sim_substructure.title
        sim_substructure_dict.update(sim_substructure.to_body_dict())

    for exp_substructure_dict in publication['exp_substructures']:
        exp_substructure = ExpSubstructure.manager().get(
            service_account(),
            uuid=exp_substructure_dict['uuid']
        )
        exp_substructure_subj = ET.SubElement(subjects, 'subject')
        exp_substructure_subj.text = exp_substructure.title
        exp_substructure_dict.update(exp_substructure.to_body_dict())

    for coordinator_output_dict in publication['coordinator_outputs']:
        coordinator_output = CoordinatorOutput.manager().get(
            service_account(),
            uuid=coordinator_output_dict['uuid']
        )
        coordinator_output_subj = ET.SubElement(subjects, 'subject')
        coordinator_output_subj.text = coordinator_output.title
        coordinator_output_dict.update(coordinator_output.to_body_dict())

    for sim_output_dict in publication['sim_outputs']:
        sim_output = SimOutput.manager().get(
            service_account(),
            uuid=sim_output_dict['uuid']
        )
        sim_output_subj = ET.SubElement(subjects, 'subject')
        sim_output_subj.text = sim_output.title
        sim_output_dict.update(sim_output.to_body_dict())

    for exp_output_dict in publication['exp_outputs']:
        exp_output = ExpOutput.manager().get(
            service_account(),
            uuid=exp_output_dict['uuid']
        )
        exp_output_subj = ET.SubElement(subjects, 'subject')
        exp_output_subj.text = exp_output.title
        exp_output_dict.update(exp_output.to_body_dict())

    for report_dict in publication.get('reports', []):
        report = HybridReport.manager().get(service_account(), uuid=report_dict['uuid'])
        report_subj = ET.SubElement(subjects, 'subject')
        report_subj.text = report.title
        report_dict.update(report.to_body_dict())

    for analysis_dict in publication.get('analysiss', []):
        analysis = HybridAnalysis.manager().get(service_account(), uuid=analysis_dict['uuid'])
        analysis_subj = ET.SubElement(subjects, 'subject')
        analysis_subj.text = analysis.title
        analysis_dict.update(analysis.to_body_dict())

    _update_doi(doi, xml_obj)
    return (doi, ark, xml_obj)


def mission_reserve_xml(publication, project, mission, authors_details=None, mis_doi=None):
    xml_obj = _mission_required_xml(
        authors_details,
        mission,
        publication['created'],
        mis_doi
    )
    if not mis_doi:
        reserve_res = _reserve_doi(
            xml_obj,
            ENTITY_TARGET_BASE.format(
                project_id=publication['project']['value']['projectId'],
                entity_uuid=mission.uuid
            )
        )
        doi = reserve_res
        ark = doi
    else:
        doi = mis_doi
        ark = mis_doi

    doi = doi.strip()
    ark = ark.strip()
    identifier = xml_obj.find('identifier')
    identifier.text = doi
    resource = xml_obj

    subjects = ET.SubElement(resource, 'subjects')
    mis_type = ET.SubElement(subjects, 'subject')
    mis_type.text = project.nh_event.title()

    for collection_dict in publication['collections']:
        collection = Collection.manager().get(
            service_account(),
            uuid=collection_dict['uuid']
        )
        collection_subj = ET.SubElement(subjects, 'subject')
        collection_subj.text = collection.title
        collection_dict.update(collection.to_body_dict())

    for report_dict in publication['reports']:
        report = Report.manager().get(
            service_account(),
            uuid=report_dict['uuid']
        )
        report_subj = ET.SubElement(subjects, 'subject')
        report_subj.text = report.title
        report_dict.update(report.to_body_dict())

    _update_doi(doi, xml_obj)
    return (doi, ark, xml_obj)




def project_by_uuid(uuid, prj_type):
    """Retrieves a project."""
    agv = service_account()

    if prj_type == 'experimental':
        project = ExperimentalProject.manager().get(agv, uuid=uuid)
    elif prj_type == 'simulation':
        project = SimulationProject.manager().get(agv, uuid=uuid)
    elif prj_type == 'simulation':
        project = HybridSimulationProject.manager().get(agv, uuid=uuid)
    else:
        project = BaseProject.manager().get(agv, uuid=uuid)

    return project


def project_reserve_xml(publication, project, authors_details=None):
    institutions = set()
    if not authors_details:
        authors_details = []
        for username in [project.pi] + project.co_pis:
            try:
                author = get_user_model().objects.get(username=username)
            except ObjectDoesNotExist:
                continue

            user_tas = TASClient().get_user(username=username)
            authors_details.append({
                'username': username,
                'first_name': author.first_name,
                'last_name': author.last_name
            })
            institutions.add(user_tas['institution'])
    else:
        for author in authors_details:
            institutions.add(author.get('inst'))

    xml_obj = _project_required_xml(
        project=project,
        authors=authors_details,
        created=publication['created'],
        doi=publication['project'].get('doi')
    )

    now = dateutil.parser.parse(publication['created'])
    if not publication['project'].get('doi', ''):
        reserve_resp = _reserve_doi(xml_obj, TARGET_BASE.format(project_id=project.project_id))
        doi = reserve_resp
        ark = doi
    else:
        doi = publication['project'].get('doi')
        ark = publication['project'].get('doi')

    doi = doi.strip()
    ark = ark.strip()

    identifier = xml_obj.find('identifier')
    identifier.text = doi

    #Optional stuff
    resource = xml_obj
    subjects = ET.SubElement(resource, 'subjects')
    for keyword in project.keywords.split(','):
        subject = ET.SubElement(subjects, 'subject')
        subject.text = keyword.strip().title()

    contributors = ET.SubElement(resource, 'contributors')
    for institution in institutions:
        contrib = ET.SubElement(contributors, 'contributor')
        name = ET.SubElement(contrib, 'contributorName')
        name.text = institution
        contrib.attrib['contributorType'] = 'HostingInstitution'

    dates = ET.SubElement(resource, 'dates')
    date_publication = ET.SubElement(dates, 'date')
    date_publication.attrib['dateType'] = 'Accepted'
    date_publication.text = '{}-{}-{}'.format(now.year, now.month, now.day)

    language = ET.SubElement(resource, 'language')
    language.text = 'English'

    alternate_ids = ET.SubElement(resource, 'alternateIdentifiers')
    if hasattr(project, 'award_numbers'):
        for anmbr in project.award_numbers:
            award_number = ET.SubElement(alternate_ids, 'alternateIdentifier')
            award_number.attrib['alternateIdentifierType'] = 'NSF Award Number'
            award_number.text = '{name} - {number}'.format(
                name=anmbr['name'],
                number=anmbr['number']
            )

    project_id = ET.SubElement(alternate_ids, 'alternateIdentifier')
    project_id.attrib['alternateIdentifierType'] = 'Project ID'
    project_id.text = project.project_id

    rights_list = ET.SubElement(resource, 'rightsList')
    rights = ET.SubElement(rights_list, 'rights')
    rights.attrib['rightsURI'] = 'http://opendatacommons.org/licenses/by/1-0/'
    rights.text = 'ODC-BY 1.0'
    _update_doi(doi, xml_obj)
    return (doi, ark, xml_obj)

def add_related(xml_obj, dois):
    doi = xml_obj.find('identifier').text
    resource = xml_obj
    related_ids = ET.SubElement(resource, 'relatedIdentifiers')
    for _doi in dois:
        related = ET.SubElement(related_ids, 'relatedIdentifier')
        related.attrib['relatedIdentifierType'] = 'DOI'
        related.attrib['relationType'] = 'IsPartOf'
        related.text = _doi

    _update_doi(doi, xml_obj)
    return (doi, xml_obj)

def publish_project(doi, xml_obj):
    #doi, ark, xml_obj = _project_publish_xml(publication)
    xml_str = ET.tostring(xml_obj, encoding="UTF-8", method="xml")
    metadata = {'_status': 'public', 'datacite': xml_str}
    res = requests.post('{}/id/{}'.format(BASE_URI, doi),
                        format_req(metadata),
                        auth=CREDS,
                        headers={'Content-Type': 'text/plain'})
    res = parse_response(res.text)
    if 'success' in res:
        return res['success'].split('|')
    else:
        logger.exception(res['error'])
        raise Exception(res['error'])

def get_or_craete_authors(publication):
    # we can probably remove this if authors return authors business
    authors = publication.get('authors', [])
    if authors:
        return authors

    if publication['project']['value']['projectType'] == 'experimental':
        authors = publication['experimentsList'][-1].get('authors')
    elif publication['project']['value']['projectType'] == 'simulation':
        authors = publication['simulations'][-1].get('authors')
    elif publication['project']['value']['projectType'] == 'hybrid_simulation':
        authors = publication['hybrid_simulations'][-1].get('authors')
    elif publication['project']['value']['projectType'] == 'field_recon':
        authors = publication['missions'][-1].get('authors')
    elif publication['project']['value']['projectType'] == 'other':
        authors = publication['project']['value'].get('teamOrder')

    for author in authors:
        if not author.get('lname'):
            try:
                user = get_user_model().objects.get(username=author.get('name'))
                author['lname'] = user.last_name
                author['fname'] = user.first_name
                author['email'] = user.email
                user_tas = TASClient().get_user(username=user.username)
                author['inst'] = user_tas.get('institution')
            except ObjectDoesNotExist:
                logger.error('User does not exists: %s', author.get('name'))

    publication['authors'] = authors
    return publication['authors']


def reserve_publication(publication):
    project = project_by_uuid(
        publication['project']['uuid'],
        publication['project']['value']['projectType']
    )
    proj_doi, proj_ark, proj_xml = project_reserve_xml(
        publication,
        project,
        get_or_craete_authors(publication)
    )
    logger.debug('proj_doi: %s', proj_doi)
    logger.debug('proj_ark: %s', proj_ark)
    logger.debug('proj_xml: %s', proj_xml)
    exps_dois = []
    anl_dois = []
    sim_dois = []
    mis_dois = []
    xmls = {proj_doi: proj_xml}
    publication['project']['doi'] = proj_doi
    if project.project_type.lower() == 'experimental':
        for pexp in publication['experimentsList']:
            exp = Experiment.manager().get(service_account(), uuid=pexp['uuid'])
            exp_doi = pexp.get('doi', '')
            authors = pexp['authors']

            exp_doi, exp_ark, exp_xml = experiment_reserve_xml(
                publication,
                project,
                exp,
                authors,
                exp_doi
            )
            add_related(exp_xml, [proj_doi])
            exps_dois.append(exp_doi)
            exp_dict = exp.to_body_dict()
            keys_to_drop = []
            for key in exp_dict:
                if key.startswith('_'):
                    keys_to_drop.append(key)
                elif key.endswith('_set'):
                    keys_to_drop.append(key)

            exp_dict['value'].pop('authors', '')
            for key in keys_to_drop:
                exp_dict.pop(key)

            pexp.update(exp_dict)
            pexp['doi'] = exp_doi
            xmls[exp_doi] = exp_xml
            logger.debug('exp_doi: %s', exp_doi)
            logger.debug('exp_ark: %s', exp_ark)
            logger.debug('exp_xml: %s', exp_xml)

        add_related(proj_xml, exps_dois + anl_dois)
        for _doi in [proj_doi] + exps_dois + anl_dois:
            logger.debug('Final project doi: %s', _doi)
            _update_doi(_doi, xmls[_doi], status='public')

    elif project.project_type.lower() == 'simulation':
        for psim in publication['simulations']:
            sim = Simulation.manager().get(service_account(), uuid=psim['uuid'])
            sim_doi = psim.get('doi')
            authors = psim['authors']

            sim_doi, sim_ark, sim_xml = simulation_reserve_xml(
                publication,
                project,
                sim,
                authors,
                sim_doi
            )
            add_related(sim_xml, [proj_doi])
            sim_dois.append(sim_doi)
            sim_dict = sim.to_body_dict()
            keys_to_drop = []
            for key in sim_dict:
                if key.startswith('_'):
                    keys_to_drop.append(key)
                elif key.endswith('_set'):
                    keys_to_drop.append(key)

            sim_dict['value'].pop('authors', '')
            for key in keys_to_drop:
                sim_dict.pop(key)

            psim.update(sim_dict)
            psim['doi'] = sim_doi
            xmls[sim_doi] = sim_xml
            logger.debug('sim_doi: %s', sim_doi)
            logger.debug('sim_ark: %s', sim_ark)
            logger.debug('sim_xml: %s', sim_xml)

        add_related(proj_xml, sim_dois)
        for _doi in [proj_doi] + sim_dois:
            logger.debug('DOI: %s', _doi)
            _update_doi(_doi, xmls[_doi], status='public')
    elif project.project_type.lower() == 'hybrid_simulation':
        for psim in publication.get('hybrid_simulations', []):
            sim = HybridSimulation.manager().get(service_account(), uuid=psim['uuid'])
            sim_doi = psim.get('doi')
            authors = psim['authors']

            sim_doi, sim_ark, sim_xml = hybrid_simulation_reserve_xml(
                publication,
                project,
                sim,
                authors,
                sim_doi
            )
            add_related(sim_xml, [proj_doi])
            sim_dois.append(sim_doi)
            sim_dict = sim.to_body_dict()
            keys_to_drop = []
            for key in sim_dict:
                if key.startswith('_'):
                    keys_to_drop.append(key)
                elif key.endswith('_set'):
                    keys_to_drop.append(key)

            sim_dict['value'].pop('authors', '')
            for key in keys_to_drop:
                sim_dict.pop(key)

            psim.update(sim_dict)
            psim['doi'] = sim_doi
            xmls[sim_doi] = sim_xml
            logger.debug('sim_doi: %s', sim_doi)
            logger.debug('sim_ark: %s', sim_ark)
            logger.debug('sim_xml: %s', sim_xml)
        add_related(proj_xml, sim_dois)
        for _doi in [proj_doi] + sim_dois:
            logger.debug('DOI: %s', _doi)
            _update_doi(_doi, xmls[_doi], status='public')
    elif project.project_type.lower() == 'field_recon':
        for pmis in publication.get('missions', []):
            mission = Mission.manager().get(service_account(), uuid=psim['uuid'])
            mis_doi = pmis.get('doi')
            authors = pmis['authors']

            mis_doi, mis_ark, mis_xml = mission_reserve_xml(
                publication,
                project,
                mission,
                authors,
                mis_doi
            )
            add_related(mis_xml, [proj_doi])
            mis_dois.append(mis_doi)
            mis_dict = mission.to_body_dict()
            keys_to_drop = []
            for key in mis_dict:
                if key.startswith('_'):
                    keys_to_drop.append(key)
                elif key.endswith('_set'):
                    keys_to_drop.append(key)

            mis_dict['value'].pop('authors', '')
            for key in keys_to_drop:
                mis_dict.pop(key)

            pmis.update(mis_dict)
            pmis['doi'] = mis_doi
            xmls[mis_doi] = mis_xml
            logger.debug('mis_doi: %s', mis_doi)
            logger.debug('mis_ark: %s', mis_ark)
            logger.debug('mis_xml: %s', mis_xml)
        add_related(proj_xml, mis_dois)
        for _doi in [proj_doi] + mis_dois:
            logger.debug('DOI: %s', _doi)
            _update_doi(_doi, xmls[_doi], status='public')
    else:
        _update_doi(proj_doi, xmls[proj_doi], status='public')
    return publication
