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

logger = logging.getLogger(__name__)

USER = settings.EZID_USER
PASSWORD = settings.EZID_PASS
CREDS = (USER, PASSWORD)
BASE_URI = 'https://ezid.cdlib.org/'
SHOULDER = settings.EZID_SHOULDER or 'doi:10.5072/FK2'
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
        anvl.append("%s: %s" % (key, value))
    ret = ''
    for anv in anvl:
        try:
            ret += '\n'.join([anv])
        except UnicodeError:
            encoding = chardet.detect(anv)['encoding']
            anv = anv.decode(encoding)
            ret += '\n'.join([anv])
    logger.debug(ret)
    return ret

def _reserve_doi(xml_obj, target):
    xml_str = ET.tostring(xml_obj, encoding="UTF-8", method="xml")
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

    response = requests.post('{}/id/{}'.format(BASE_URI, doi),
                             data=format_req(metadata),
                             auth=CREDS,
                             headers={'Content-Type': 'text/plain'})
    res = parse_response(response.text)
    if 'success' in res:
        return res['success']
    else:
        raise Exception(res['error'])

def _project_required_xml(publication):
    project_body = publication['project']
    proj = project_body['value']
    xml_obj = _project_header()

    resource = xml_obj
    identifier = ET.SubElement(resource, 'identifier')
    identifier.attrib['identifierType'] = 'DOI'
    if project_body.get('doi', ''):
        identifier.text = project_body.get('doi')
    else:
        identifier.text = SHOULDER.replace('doi:', '')
    creators = ET.SubElement(resource, 'creators')
    #um = get_user_model()
    users = sorted(publication['users'], key=lambda x: x['_ui']['order'])
    for author in users:
        creator = ET.SubElement(creators, 'creator')
        creator_name = ET.SubElement(creator, 'creatorName')
        creator_name.text = '{}, {}'.format(author['last_name'], author['first_name'])

    titles = ET.SubElement(resource, 'titles')
    title = ET.SubElement(titles, 'title')
    title.text = proj['title']
    publisher = ET.SubElement(resource, 'publisher')
    publisher.text = 'Designsafe-CI'

    now = dateutil.parser.parse(publication['created'])
    publication_year = ET.SubElement(resource, 'publicationYear')
    publication_year.text = str(now.year)

    resource_type = ET.SubElement(resource, 'resourceType')
    resource_type.text = "Project/{}".format(proj['projectType'].title())
    resource_type.attrib['resourceTypeGeneral'] = 'Dataset'
    descriptions = ET.SubElement(resource, 'descriptions')
    desc = ET.SubElement(descriptions, 'description')
    desc.attrib['descriptionType'] = 'Abstract'
    desc.text = proj['description']
    return xml_obj

def _experiment_required_xml(users, experiment, created):
    exp = experiment['value']
    xml_obj = _project_header()

    resource = xml_obj
    identifier = ET.SubElement(resource, 'identifier')
    identifier.attrib['identifierType'] = 'DOI'
    if exp.get('doi', ''):
        identifier.text = exp.get('doi')
    else:
        identifier.text = SHOULDER.replace('doi:', '')
    creators = ET.SubElement(resource, 'creators')
    #um = get_user_model()
    authors = exp.get('authors')
    #authors = authors or users
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
    title.text = exp['title']
    publisher = ET.SubElement(resource, 'publisher')
    publisher.text = 'Designsafe-CI'

    now = dateutil.parser.parse(created)
    publication_year = ET.SubElement(resource, 'publicationYear')
    publication_year.text = str(now.year)

    resource_type = ET.SubElement(resource, 'resourceType')
    resource_type.text = "Experiment/{}".format(exp['experimentType'].title())
    resource_type.attrib['resourceTypeGeneral'] = 'Dataset'
    descriptions = ET.SubElement(resource, 'descriptions')
    desc = ET.SubElement(descriptions, 'description')
    desc.attrib['descriptionType'] = 'Abstract'
    desc.text = exp['description']
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

def _simulation_required_xml(users, simulation, created):
    sim = simulation['value']
    xml_obj = _project_header()

    resource = xml_obj
    identifier = ET.SubElement(resource, 'identifier')
    identifier.attrib['identifierType'] = 'DOI'
    if sim.get('doi', ''):
        identifier.text = sim.get('doi')
    else:
        identifier.text = SHOULDER.replace('doi:', '')
    creators = ET.SubElement(resource, 'creators')
    #um = get_user_model()
    authors = sim.get('authors')
    #authors = authors or users
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
    title.text = sim['title']
    publisher = ET.SubElement(resource, 'publisher')
    publisher.text = 'Designsafe-CI'

    now = dateutil.parser.parse(created)
    publication_year = ET.SubElement(resource, 'publicationYear')
    publication_year.text = str(now.year)

    resource_type = ET.SubElement(resource, 'resourceType')
    resource_type.text = "Simulation/{}".format(
            sim['simulationType'].title())
    resource_type.attrib['resourceTypeGeneral'] = 'Dataset'
    descriptions = ET.SubElement(resource, 'descriptions')
    desc = ET.SubElement(descriptions, 'description')
    desc.attrib['descriptionType'] = 'Abstract'
    desc.text = sim['description']
    return xml_obj


def analysis_reserve_xml(publication, analysis, created):
    anl = analysis['value']
    xml_obj = _analysis_required_xml(publication['users'], analysis,
                                     created)
    now = dateutil.parser.parse(created)
    reserve_res = _reserve_doi(xml_obj, ENTITY_TARGET_BASE.format(
        project_id=publication['project']['value']['projectId'], entity_uuid=analysis['uuid']))
    doi, ark = reserve_res.split('|')
    doi = doi.strip()
    ark = ark.strip()
    identifier = xml_obj.find('identifier')
    identifier.text = doi
    resource = xml_obj
    _update_doi(doi, xml_obj)
    return (doi, ark, xml_obj)

def experiment_reserve_xml(publication, experiment, created):
    exp = experiment['value']
    xml_obj = _experiment_required_xml(publication['users'], experiment,
                                       created)
    now = dateutil.parser.parse(created)
    if not experiment.get('doi', ''):
        reserve_res = _reserve_doi(
            xml_obj,
            ENTITY_TARGET_BASE.format(
                project_id=publication['project']['value']['projectId'],
                entity_uuid=experiment['uuid']
            )
        )
        doi, ark = reserve_res.split('|')
    else:
        doi = experiment.get('doi')
        ark = experiment.get('doi')

    doi = doi.strip()
    ark = ark.strip()
    identifier = xml_obj.find('identifier')
    identifier.text = doi
    resource = xml_obj
    contributors = ET.SubElement(resource, 'contributors')
    contributor = ET.SubElement(contributors, 'contributor')
    contributor.attrib['contributorType'] = 'HostingInstitution'
    name = ET.SubElement(contributor, 'contributorName')
    name.text = exp['experimentalFacility']
    subjects = ET.SubElement(resource, 'subjects')
    exp_type = ET.SubElement(subjects, 'subject')
    exp_type.text = exp['experimentType'].title()
    eq_type = ET.SubElement(subjects, 'subject')
    eq_type.text = exp['equipmentType']
    events = [event for event in publication['eventsList'] if \
              experiment['uuid'] in event['associationIds']]

    for event in events:
        event_subj = ET.SubElement(subjects, 'subject')
        event_subj.text = event['value']['title']

    mcfs = [mcf for mcf in publication['modelConfigs'] if \
              experiment['uuid'] in mcf['associationIds']]

    for mcf in mcfs:
        mcf_subj = ET.SubElement(subjects, 'subject')
        mcf_subj.text = mcf['value']['title']

    slts = [slt for slt in publication['sensorLists'] if \
              experiment['uuid'] in slt['associationIds']]

    for slt in slts:
        slt_subj = ET.SubElement(subjects, 'subject')
        slt_subj.text = slt['value']['title']

    _update_doi(doi, xml_obj)
    return (doi, ark, xml_obj)

def simulation_reserve_xml(publication, simulation, created):
    sim = simulation['value']
    xml_obj = _simulation_required_xml(
                publication['users'],
                simulation,
                created
            )
    now = dateutil.parser.parse(created)
    if not simulation.get('doi', ''):
        reserve_res = _reserve_doi(
            xml_obj,
            ENTITY_TARGET_BASE.format(
                project_id=publication['project']['value']['projectId'],
                entity_uuid=simulation['uuid']
            )
        )
        doi, ark = reserve_res.split('|')
    else:
        doi = simulation.get('doi')
        ark = simulation.get('doi')

    doi = doi.strip()
    ark = ark.strip()
    identifier = xml_obj.find('identifier')
    identifier.text = doi
    resource = xml_obj
    subjects = ET.SubElement(resource, 'subjects')
    sim_type = ET.SubElement(subjects, 'subject')
    sim_type.text = sim['simulationType'].title()
    entities = (
        simulation.get('models', []) +
        simulation.get('inputs', []) +
        simulation.get('outputs', [])
    )

    for entity in entities:
        ent_sub = ET.SubElement(subjects, 'subject')
        ent_sub.text = entity['value']['title']

    _update_doi(doi, xml_obj)
    return (doi, ark, xml_obj)

def hybrid_simulation_reserve_xml(publication, simulation, created):
    sim = simulation['value']
    xml_obj = _simulation_required_xml(
                publication['users'],
                simulation,
                created
            )
    now = dateutil.parser.parse(created)
    if not simulation.get('doi', ''):
        reserve_res = _reserve_doi(
            xml_obj,
            ENTITY_TARGET_BASE.format(
                project_id=publication['project']['value']['projectId'],
                entity_uuid=simulation['uuid']
            )
        )
        doi, ark = reserve_res.split('|')
    else:
        doi = simulation.get('doi')
        ark = simulation.get('doi')

    doi = doi.strip()
    ark = ark.strip()
    identifier = xml_obj.find('identifier')
    identifier.text = doi
    resource = xml_obj
    subjects = ET.SubElement(resource, 'subjects')
    sim_type = ET.SubElement(subjects, 'subject')
    sim_type.text = sim['simulationType'].title()
    entities = (
        simulation.get('global_models', []) +
        simulation.get('coordinators', []) +
        simulation.get('sim_substructures', []) + 
        simulation.get('exp_substructures', [])
    )

    for entity in entities:
        ent_sub = ET.SubElement(subjects, 'subject')
        ent_sub.text = entity['value']['title']

    _update_doi(doi, xml_obj)
    return (doi, ark, xml_obj)


def project_reserve_xml(publication):
    project_body = publication['project']
    proj = project_body['value']
    xml_obj = _project_required_xml(publication)
    now = dateutil.parser.parse(publication['created'])
    if not project_body.get('doi', ''):
        reserve_resp = _reserve_doi(xml_obj, TARGET_BASE.format(project_id=proj['projectId']))
        doi, ark = reserve_resp.split('|')
    else:
        doi = project_body.get('doi')
        ark = project_body.get('doi')
    doi = doi.strip()
    ark = ark.strip()
    identifier = xml_obj.find('identifier')
    identifier.text = doi

    #Optional stuff
    resource = xml_obj
    subjects = ET.SubElement(resource, 'subjects')
    for keyword in proj['keywords'].split(','):
        subject = ET.SubElement(subjects, 'subject')
        subject.text = keyword.strip().title()

    institutions = publication['institutions']
    contributors = ET.SubElement(resource, 'contributors')
    for institution in institutions:
        if not institution.get('label', None):
            continue

        contrib = ET.SubElement(contributors, 'contributor')
        name = ET.SubElement(contrib, 'contributorName')
        name.text = institution['label']
        contrib.attrib['contributorType'] = 'HostingInstitution'

    dates = ET.SubElement(resource, 'dates')
    date_publication = ET.SubElement(dates, 'date')
    date_publication.attrib['dateType'] = 'Accepted'
    date_publication.text = '{}-{}-{}'.format(now.year, now.month, now.day)

    language = ET.SubElement(resource, 'language')
    language.text = 'English'

    alternate_ids = ET.SubElement(resource, 'alternateIdentifiers')
    if proj['awardNumber']:
        award_number = ET.SubElement(alternate_ids, 'alternateIdentifier')
        award_number.attrib['alternateIdentifierType'] = 'NSF Award Number'
        award_number.text = proj['awardNumber']

    project_id = ET.SubElement(alternate_ids, 'alternateIdentifier')
    project_id.attrib['alternateIdentifierType'] = 'Project ID'
    project_id.text = proj['projectId']

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

def reserve_publication(publication, analysis_doi=False):
    proj_doi, proj_ark, proj_xml = project_reserve_xml(publication)
    logger.debug('proj_doi: %s', proj_doi)
    logger.debug('proj_ark: %s', proj_ark)
    logger.debug('proj_xml: %s', proj_xml)
    exps_dois = []
    anl_dois = []
    sim_dois = []
    xmls = {proj_doi: proj_xml}
    publication['project']['doi'] = proj_doi
    if publication['project']['value']['projectType'].lower() == 'experimental':
        for exp in publication.get('experimentsList', []):
            exp_doi, exp_ark, exp_xml = experiment_reserve_xml(publication,
                                                               exp,
                                                               publication['created'])
            add_related(exp_xml, [proj_doi])
            exps_dois.append(exp_doi)
            exp['doi'] = exp_doi
            xmls[exp_doi] = exp_xml
            logger.debug('exp_doi: %s', exp_doi)
            logger.debug('exp_ark: %s', exp_ark)
            logger.debug('exp_xml: %s', exp_xml)

        if analysis_doi:
            for anl in publication.get('analysisList', []):
                anl_doi, anl_ark, anl_xml = analysis_reserve_xml(publication,
                                                                 anl,
                                                                 publication['created'])
                add_related(anl_xml, [proj_doi])
                anl_dois.append(anl_doi)
                anl['doi'] = anl_doi
                xmls[anl_doi] = anl_xml
                logger.debug('anl_doi: %s', anl_doi)
                logger.debug('anl_ark: %s', anl_ark)
                logger.debug('anl_xml: %s', anl_xml)

        add_related(proj_xml, exps_dois + anl_dois)
        for _doi in [proj_doi] + exps_dois + anl_dois:
            logger.debug('Final project doi: %s', _doi)
            _update_doi(_doi, xmls[_doi], status='public')
    elif publication['project']['value']['projectType'].lower() == 'simulation':
        for sim in publication.get('simulations', []):
            sim_doi, sim_ark, sim_xml = simulation_reserve_xml(
                    publication,
                    sim,
                    publication['created']
            )
            logger.debug('sim_doi: %s', sim_doi)
            logger.debug('sim_ark: %s', sim_ark)
            logger.debug('sim_xml: %s', sim_xml)
            add_related(sim_xml, [proj_doi])
            sim_dois.append(sim_doi)
            sim['doi'] = sim_doi
            xmls[sim_doi] = sim_xml
        add_related(proj_xml, sim_dois)
        for _doi in [proj_doi] + sim_dois:
            logger.debug('DOI: %s', _doi)
            _update_doi(_doi, xmls[_doi], status='public')
    elif publication['project']['value']['projectType'].lower() == 'hybrid_simulation':
        for sim in publication.get('hybrid_simulations', []):
            sim_doi, sim_ark, sim_xml = hybrid_simulation_reserve_xml(
                    publication,
                    sim,
                    publication['created']
            )
            logger.debug('sim_doi: %s', sim_doi)
            logger.debug('sim_ark: %s', sim_ark)
            logger.debug('sim_xml: %s', sim_xml)
            add_related(sim_xml, [proj_doi])
            sim_dois.append(sim_doi)
            sim['doi'] = sim_doi
            xmls[sim_doi] = sim_xml
        add_related(proj_xml, sim_dois)
        for _doi in [proj_doi] + sim_dois:
            logger.debug('DOI: %s', _doi)
            _update_doi(_doi, xmls[_doi], status='public')
    else:
        _update_doi(proj_doi, xmls[proj_doi], status='public')
    return publication
