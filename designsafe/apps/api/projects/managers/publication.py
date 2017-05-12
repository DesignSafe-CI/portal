import re
import logging
import xml.etree.ElementTree as ET
from xml.dom import minidom
from django.contrib.auth import get_user_model
import datetime
import requests

logger = logging.getLogger(__name__)

USER = 'uta_peteng'
PASSWORD = 'dUbLfaim#3'
CREDS = (USER, PASSWORD)
BASE_URI = 'https://ezid.cdlib.org/'
SHOULDER = 'doi:10.5072/FK2'

def pretty_print(xml):
    """Return a pretty-printed XML string for the Element.
    """
    rough_string = ET.tostring(xml, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")

def _project_header():
    xml_obj = ET.Element("resource")
    xml_obj.attrib["xmlns"] = "http://datacite.org/schema/kernel-4"
    xml_obj.attrib["xmlns:xs"] = "http://www.w3.org/2001/XMLSchema"
    xml_obj.attrib["xsi:schemaLocation"] = "http://datacite.org/schema/kernel-3 http://schema.datacite.org/meta/kernel-4/metadata.xsd"
    return xml_obj

def _unescape(s):
    return re.sub("%([0-9A-Fa-f][0-9A-Fa-f])",
                  lambda m: chr(int(m.group(1), 16)), s)

def parse_response(res):
    response = dict(tuple(_unescape(v).strip() for v in l.split(":", 1)) \
                          for l in res.decode("UTF-8").splitlines())
    return response

def _reserve_doi(xml_obj):
    metadata = {'_status': 'reserved', 'datacite': xml_obj}
    res = requests.post('{}/shoulder/{}'.format(BASE_URI, SHOULDER),
                        data=metadata, auth=CREDS, headers={'Content-Type': 'text/plain'})
    res = parse_response(res.text)
    if 'success' in res:
        return res['success']
    else:
        logger.exception(res['error'])
        raise Exception(res['error'])

def _project_required_xml(publication):
    project_body = publication['project']
    proj = project_body['value']
    xml_obj = _project_header()

    resource = ET.SubElement(xml_obj, 'resource')
    identifier = ET.SubElement(resource, 'identifier')
    identifier.attrib['identifierType'] = 'DOI'
    identifier.text = SHOULDER
    creators = ET.SubElement(resource, 'creators')
    um = get_user_model()
    for author in [proj['pi']] + proj['coPis'] + proj['teamMember']:
        user = um.objects.get(username=author)
        creator = ET.SubElement(creators, 'creator')
        creator_name = ET.SubElement(creator, 'creatorName')
        creator_name.text = '{}, {}'.format(user.last_name, user.first_name)

    titles = ET.SubElement(resource, 'titles')
    title = ET.SubElement(titles, 'titles')
    title.text = proj['title']
    publisher = ET.SubElement(resource, 'publisher')
    publisher.text = 'Designsafe-CI'

    now = datetime.datetime.now()
    publication_year = ET.SubElement(resource, 'publicationYear')
    publication_year.text = now.year

    resource_type = ET.SubElement(resource, 'resourceType')
    resource_type.text = proj['projectType']
    return xml_obj

def _project_publish_xml(publication):
    project_body = publication['project']
    proj = project_body['value']
    xml_obj = _project_required_xml(publication)
    now = datetime.datetime.now()
    doi = _reserve_doi(xml_obj)

    #Optional stuff
    resource = xml_obj.find('resource')
    subjects = ET.SubElement(resource, 'subjects')
    for keyword in proj['keywords']:
        subject = ET.SubElement(subjects, 'subject')
        subject.text = keyword

    institutions = publication['institutions']
    contributors = ET.SubElement(resource, 'contributors')
    for institution in institutions:
        contrib = ET.SubElement(contributors, 'contributor')
        contrib.text = institution

    dates = ET.SubElement(resource, 'dates')
    date_publication = ET.SubElement(dates, 'date')
    date_publication.attrib['dateType'] = 'Date of Publication'
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

    return xml_obj

def publish_project(publication):
    xml_obj = _project_publish_xml(publication)
    logger.debug(pretty_print(xml_obj))
