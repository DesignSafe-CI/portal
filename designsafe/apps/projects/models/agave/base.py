"""Base"""
import datetime
import logging
import six
import json
import os
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from pytas.http import TASClient
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields
from designsafe.apps.data.models.elasticsearch import IndexedPublication, IndexedPublicationLegacy
from designsafe.libs.elasticsearch.exceptions import DocumentNotFound
logger = logging.getLogger(__name__)


class RelatedEntity(MetadataModel):
    """Model for entities related to projects."""

    def to_body_dict(self):
        """Serialize to Agave's REST API payload JSON."""
        body_dict = super(RelatedEntity, self).to_body_dict()
        body_dict['_relatedFields'] = []
        for attrname, field in six.iteritems(self._meta._related_fields):
            body_dict['_relatedFields'].append(attrname)
        return body_dict

    def to_datacite_json(self):
        """Serialize object to datacite JSON.

        Every entity subclassing this class should add a `attributes['types']['resourceType']`
        e.g. ``attributes['types']['resourceType'] = Experiment/{}.format(experiment.experiment_type``
        as well as any specific subjects.
        """
        attributes = {}
        authors = [author for author in getattr(self, 'authors', [])
                   if author.get('authorship', False)]
        authors = sorted(authors, key=lambda x: x['order'])
        creators_details, institutions = _process_authors(authors)
        attributes['creators'] = creators_details
        attributes['contributors'] = [
            {
                'contributorType': 'HostingInstitution',
                'nameType': 'Organizational',
                'name': institution,
            } for institution in institutions
        ]
        attributes['titles'] = [
            {'title': self.title}
        ]
        attributes['publisher'] = 'Designsafe-CI'
        utc_now = datetime.datetime.utcnow()
        attributes['publicationYear'] = utc_now.year
        attributes['types'] = {}
        attributes['types']['resourceTypeGeneral'] = 'Dataset'
        attributes['descriptions'] = [
            {
                'descriptionType': 'Abstract',
                'description': self.description,
                'lang': 'en-Us',
            }
        ]
        attributes['language'] = 'English'
        entities = []
        for attrname in self._meta._reverse_fields:
            field = getattr(self, attrname, False)
            if not field:
                continue
            entities += field(self._meta.agave_client)
        attributes['subjects'] = [
            {'subject': entity.title} for entity in entities
        ]
        return attributes

class Project(MetadataModel):
    model_name = 'designsafe.project'
    team_members = fields.ListField('Team Members')
    guest_members = fields.ListField('Guest Members')
    co_pis = fields.ListField('Co PIs')
    project_type = fields.CharField('Project Type', max_length=255, default=None)
    data_type = fields.CharField('Data Type', max_length=255, default='')
    team_order = fields.ListField('Team Order')
    project_id = fields.CharField('Project Id')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=255, default='')
    pi = fields.CharField('PI', max_length=255)
    award_number = fields.ListField('Award Number')
    award_numbers = fields.ListField('Award Numbers')
    associated_projects = fields.ListField('Associated Project')
    ef = fields.CharField('Experimental Facility', max_length=512, default='')
    keywords = fields.CharField('Keywords', default='')
    file_tags = fields.ListField('File Tags')
    nh_types = fields.ListField('Natural Hazard Type')
    dois = fields.ListField('Dois')
    hazmapper_maps = fields.ListField('Hazmapper Maps')

    @property
    def system(self):
        return 'project-{uuid}'.format(uuid=self.uuid)

    @property
    def collaborators(self):
        return {
            'pi': self.pi,
            'coPis': self.co_pis,
            'teamMembers': self.team_members
        }

    def to_body_dict(self):
        body_dict = super(Project, self).to_body_dict()
        body_dict['_related'] = {}
        for attrname, field in six.iteritems(self._meta._related_fields):
            body_dict['_related'][attrname] = field.rel_cls.model_name

        for attrname in self._meta._reverse_fields:
            field = getattr(self, attrname)
            body_dict['_related'][attrname] = field.related_obj_name

        return body_dict

    def add_pi(self, username):
        self._add_team_members_pems([username])
        # this may be where we are always adding the PI
        # if len(self.pi) > 0:
        #     self.team_members += [self.pi]
        #     self.team_members = list(set(self.team_members))
        self.pi = username
        self.save(self.manager().agave_client)
        return self

    def remove_pi(self, username):
        self._remove_team_members_pems([username])
        if len(self.co_pis):
            self.pi = self.co_pis[0]
        # elif len(self.team_members):
        #     self.pi = self.team_members[0]
        self.save(self.manager().agave_client)
        return self

    def add_co_pis(self, usernames):
        self._add_team_members_pems(usernames)
        self.co_pis += usernames
        self.co_pis = list(set(self.co_pis))
        self.save(self.manager().agave_client)
        return self

    def remove_co_pis(self, usernames):
        self._remove_team_members_pems(usernames)
        self.co_pis = [co_pi for co_pi in self.co_pis if co_pi not in usernames]
        self.save(self.manager().agave_client)
        return self

    def add_team_members(self, usernames):
        self._add_team_members_pems(usernames)
        self.team_members += usernames
        self.team_members = list(set(self.team_members))
        self.save(self.manager().agave_client)
        return self

    def remove_team_members(self, usernames):
        self._remove_team_members_pems(usernames)
        self.team_members = [member for member in self.team_members if member not in usernames]
        self.save(self.manager().agave_client)
        return self

    def _add_team_members_pems(self, usernames):
        agave_client = self.manager().agave_client
        for username in usernames:
            self.set_pem(username, 'ALL')
            agave_client.systems.updateRole(
                systemId=self.system,
                body={'username': username, 'role': 'USER'})
        return self

    def _remove_team_members_pems(self, usernames):
        agave_client = self.manager().agave_client
        for username in usernames:
            self.set_pem(username, 'NONE')
            agave_client.systems.updateRole(
                systemId=self.system,
                body={'username': username, 'role': 'NONE'})
        return self

    def add_admin(self, username):
        """
        Gives the provided user access to a project
        without listing them among the authors/creators.
        """
        self.set_pem(username, 'ALL')
        self.manager().agave_client.systems.updateRole(
            systemId=self.system,
            body={'username': username, 'role': 'USER'})

    def save(self, ag):
        if self.uuid:
            prj = self.manager().get(ag, self.uuid)
            if prj.project_id and prj.project_id != 'None':
                self.project_id = prj.project_id
        super(Project, self).save(ag)

    def related_entities(self, offset=0, limit=100):
        from designsafe.apps.projects.models.utils import lookup_model
        relattrs = self._meta._reverse_fields
        rel_names = [getattr(self, attrname).related_obj_name for attrname in relattrs \
                         if getattr(self, attrname).related_obj_name != 'designsafe.file']
        resp = self.manager().agave_client.meta.listMetadata(
            q=json.dumps({'name': {'$in': rel_names}, 'associationIds': self.uuid}),
            offset=offset,
            limit=limit)
        ents = [lookup_model(rsp)(**rsp) for rsp in resp]
        return ents

    def to_dataset_json(self, **kwargs):
        """
        Serialize project to json for google dataset search
        https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/BMNJPS
        """
        dataset_json = {
            "@context": "http://schema.org",
            "@type": "Dataset",
            "@id": "",
            "identifier": "",
            "logo": "https://www.designsafe-ci.org/static/images/nsf-designsafe-logo.014999b259f6.png",
            "name": self.title,
            "creator": [
                {
                    "name": "",
                    "affiliation": "",
                    "@id": "",
                    "identifier": ""
                }
            ],
            "author": [
                {
                    "name": "",
                    "affiliation": "",
                    "@id": "",
                    "identifier": ""
                }
            ],
            "datePublished": self.created,
            "dateModified": self.to_body_dict()['lastUpdated'],
            "description": self.description,
            "keywords": self.keywords.split(','),
            "license": {
                "@type": "CreativeWork",
                "license": "",
                "url":""
            },
            "publisher": {
                "@type": "Organization",
                "name": "Designsafe-CI",
                "url": "https://designsafe-ci.org"
            },
            "provider": {
                "@type": "Organization",
                "name": "Designsafe-CI"
            },
            "includedInDataCatalog": {
                "@type": "DataCatalog",
                "name": "Designsafe-CI",
                "url": "https://designsafe-ci.org"
            },
        }
        if self.dois:
            dataset_json["distribution"] = {
                    "@context": "http://schema.org",
                    "@type": "Dataset",
                    "@id": "",
                    "identifier": "",
                    "logo": "https://www.designsafe-ci.org/static/images/nsf-designsafe-logo.014999b259f6.png",
                    "name": self.title,
                    "creator": [
                        {
                            "name": "",
                            "affiliation": "",
                            "@id": "",
                            "identifier": ""
                        }
                    ],
                    "author": [
                        {
                            "name": "",
                            "affiliation": "",
                            "@id": "",
                            "identifier": ""
                        }
                    ],
                    "datePublished": self.created,
                    "dateModified": self.to_body_dict()['lastUpdated'],
                    "description": self.description,
                    "keywords": self.keywords.split(','),
                    "license": {
                        "@type": "CreativeWork",
                        "license": "",
                        "url":""
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "Designsafe-CI",
                        "url": "https://designsafe-ci.org"
                    },
                    "provider": {
                        "@type": "Organization",
                        "name": "Designsafe-CI"
                    },
                    "includedInDataCatalog": {
                        "@type": "DataCatalog",
                        "name": "Designsafe-CI",
                        "url": "https://designsafe-ci.org"
                    },
            }

        if getattr(self, 'team_order', False):
            authors = sorted(self.team_order, key=lambda x: x['order'])
        else:
            authors = [{'name': username} for username in [self.pi] + self.co_pis]
        dataset_json['creator'] = generate_creators(authors)
        dataset_json['author'] = generate_creators(authors)
        try:
            pub = IndexedPublication.from_id(self.project_id)
            license_info =  generate_licenses(pub)
            dataset_json['license'] = license_info[0]["url"]
        except (DocumentNotFound, AttributeError):
            pass

        if self.dois:
            dataset_json['@id'] = self.dois[0]
            dataset_json['identifier'] = self.dois[0]
        else:
            doi_collection = []
            related_ents = self.related_entities()

            for i in range(len(related_ents)):
                if hasattr(related_ents[i], 'dois'):
                    dataset_json['relatedIdentifier_' + str(i)] = {
                        "@context": "http://schema.org",
                        "@type": "Dataset",
                        "@id" : "",
                        "identifier" : "",
                        "logo": "https://www.designsafe-ci.org/static/images/nsf-designsafe-logo.014999b259f6.png",
                        "name": related_ents[i].title,
                        "creator": [
                            {
                                "name": "",
                                "affiliation": "",
                                "@id": "",
                                "identifier": ""
                            }
                        ],
                        "author": [
                            {
                                "name": "",
                                "affiliation": "",
                                "@id": "",
                                "identifier": ""
                            }
                        ],
                        "datePublished": related_ents[i].created,
                        "dateModified": related_ents[i].to_body_dict()['lastUpdated'],
                        "description": related_ents[i].description,
                        "license": {
                            "@type": "CreativeWork",
                            "license": "",
                            "url": ""
                        },
                        "publisher": {
                            "@type": "Organization",
                            "name": "Designsafe-CI"
                        },
                        "provider": {
                            "@type": "Organization",
                            "name": "Designsafe-CI"
                        },
                        "includedInDataCatalog": {
                            "@type": "DataCatalog",
                            "name": "Designsafe-CI",
                            "url": "https://designsafe-ci.org"
                        },    
                    }
                    dataset_json['relatedIdentifier_' + str(i)]['@id'] = related_ents[i].dois[0]
                    dataset_json['relatedIdentifier_' + str(i)]['identifier'] = related_ents[i].dois[0]
                    
                    if getattr(related_ents[i], 'team_order', False):
                        authors = sorted(related_ents[i].team_order, key=lambda x: x['order'])
                    else:
                        authors = [{'name': username} for username in [self.pi] + self.co_pis]
                    dataset_json['relatedIdentifier_' + str(i)]['creator'] = generate_creators(authors)
                    dataset_json['relatedIdentifier_' + str(i)]['author'] = generate_creators(authors)
                    try:
                        dataset_json['relatedIdentifier_' + str(i)]['license'] = dataset_json['license']
                    except (DocumentNotFound, AttributeError):
                        pass       
         
        return dataset_json

    def to_datacite_json(self):
        """Serialize project to datacite json."""
        attributes = {}
        if getattr(self, 'team_order', False):
            authors = sorted(self.team_order, key=lambda x: x['order'])
        else:
            authors = [{'name': username} for username in [self.pi] + self.co_pis]
        creators_details, institutions = _process_authors(authors)
        attributes['creators'] = creators_details
        attributes['contributors'] = [
            {
                'contributorType': 'HostingInstitution',
                'nameType': 'Organizational',
                'name': institution,
            } for institution in institutions
        ]
        attributes['titles'] = [
            {'title': self.title}
        ]
        attributes['publisher'] = 'Designsafe-CI'
        utc_now = datetime.datetime.utcnow()
        attributes['publicationYear'] = utc_now.year
        attributes['types'] = {}
        attributes['types']['resourceType'] = 'Project/{}'.format(
            self.project_type.title().replace('_', ' ')
        )

        if getattr(self, 'data_type', False):
            attributes['types']['resourceType'] += '/{}'.format(self.data_type)

        attributes['types']['resourceTypeGeneral'] = 'Dataset'
        attributes['descriptions'] = [
            {
                'descriptionType': 'Abstract',
                'description': self.description,
                'lang': 'en-Us',
            }
        ]
        attributes['subjects'] = [
            {'subject': keyword} for keyword in self.keywords.split(',')
        ]
        attributes['language'] = 'English'
        attributes['identifiers'] = [
            {
                'identifierType': 'Project ID',
                'identifier': self.project_id,
            }
        ]
        if len(self.award_number) and type(self.award_number[0]) is not dict:
            self.award_number = [{'order': 0, 'name': ''.join(self.award_number)}]
        awards = sorted(
            self.award_number,
            key=lambda x: (x.get('order', 0), x.get('name', ''))
        )
        attributes['fundingReferences'] = []
        for award in awards:
            attributes['fundingReferences'].append({
                'funderName': award['name'],
                'awardNumber': award['number']
                })

        attributes['relatedIdentifiers'] = []
        for related_entity in self.related_entities():
            rel_ent_dict = related_entity.to_body_dict()
            if 'dois' in rel_ent_dict['value'] and len(rel_ent_dict['value']['dois']):
                attributes['relatedIdentifiers'].append({
                    'relatedIdentifier': rel_ent_dict['value']['dois'],
                    'relatedIdentifierType': 'DOI',
                    'relationType': 'IsPartOf'
                })
            elif 'uuid' in rel_ent_dict['value'] and len(rel_ent_dict['value']['uuid']):
                attributes['relatedIdentifiers'].append({
                    'relatedIdentifier': 'https://agave.designsafe-ci.org/meta/v2/data/' + related_entity['value']['uuid'],
                    'relatedIdentifierType': 'URL',
                    'relationType': 'IsPartOf'
                })

        return attributes


def generate_creators(authors):
    creators_details = []
    for author in authors:
        user_obj = None
        user_tas = None
        user_orcid = None
        if not author.get('guest'):
            try:
                user_obj = get_user_model().objects.get(username=author['name'])
                user_orcid = user_obj.profile.orcid_id if user_obj.profile.orcid_id else None
            except ObjectDoesNotExist:
                pass

        if user_obj:
            if getattr(settings, 'DESIGNSAFE_ENVIRONMENT', 'dev') == 'default':
                user_tas = TASClient().get_user(username=user_obj.username)
            else:
                user_tas = {'institution': 'dev_staging_placeholder'}

        if user_orcid:
            details = {
                '@id': user_orcid,
                'identifier': user_orcid
            }
        else:
            details = {}

        if user_obj and user_tas:
            author_name = "{} {}".format(user_obj.first_name, user_obj.last_name)
            details.update({
                "@type": "Person",
                'name': author_name,
                "affiliation": user_tas['institution']
            })
            creators_details.append(details)
        elif author.get('fname') and author.get('lname'):
            author_name = "{} {}".format(author.get('fname'), author.get('lname'))
            details.update({
                "@type": "Person",
                'name': author_name,
                "affiliation": getattr(author, 'inst', '')
            })
            creators_details.append(details)
        return creators_details

def generate_licenses(pub):
    license_details = []
    url = []
    license_type = []

    if pub.licenses.datasets == "Open Data Commons Attribution":
        license_details.append({
            "@type": "Dataset",
            "name": pub.project.value.title,
            "url": "https://opendatacommons.org/licenses/by/1-0/",
            "description": pub.project.value.description,
            "license": pub.licenses.datasets
        })
    if pub.licenses.datasets == "Open Data Commons Public Domain Dedication":
        license_details.append({
            "@type": "Dataset",
            "name": pub.project.value.title,
            "url": "https://opendatacommons.org/licenses/pddl/1-0/",
            "description": pub.project.value.description,
            "license": pub.licenses.datasets
        })
    if pub.licenses.works == "Creative Commons Attribution Share Alike":
        license_details.append({
            "@type": "CreativeWork",
            "name": pub.project.value.title,
            "url": "https://creativecommons.org/licenses/by/4.0/",
            "description": pub.project.value.description,
            "license": pub.licenses.works
        })
    if pub.licenses.works == "Creative Commons Attribution":
        license_details.append({
            "@type": "CreativeWork",
            "name": pub.project.value.title,
            "url": "https://creativecommons.org/licenses/by/4.0/",
            "description": pub.project.value.description,
            "license": pub.licenses.works
        })
    if pub.licenses.works == "Creative Commons Public Domain Dedication":
        license_details.append({
            "@type": "CreativeWork",
            "name": pub.project.value.title,
            "url": "https://creativecommons.org/publicdomain/zero/1.0/",
            "description": pub.project.value.description,
            "license": pub.licenses.works
        })
    if pub.licenses.software == "GNU General Public License":
        license_details.append({
            "@type": "CreativeWork",
            "name": pub.project.value.title,
            "url": "http://www.gnu.org/licenses/gpl.html",
            "description": pub.project.value.description,
            "license": pub.licenses.software
        })
    return license_details

def _process_authors(authors):
    """Process authors.

    This function transforms the author's details into
    an list of first name and last name and a list
    of unique institutions. This is necessary to create
    the JSON payload for the Datacite API.

    .. warning:: Authors should be sorted when passed to this
        function.

    :param list[dict] authors: List of dict with author's details.
        Each dictionary must have at least a ``'name'`` key with
        the author's username.
    """
    creators_details = []
    institutions = []
    for author in authors:
        user_obj = None
        user_tas = None
        if not author.get('guest'):
            try:
                user_obj = get_user_model().objects.get(username=author['name'])
            except ObjectDoesNotExist:
                pass

        if user_obj:
            if getattr(settings, 'DESIGNSAFE_ENVIRONMENT', 'dev') == 'default':
                user_tas = TASClient().get_user(username=user_obj.username)
            else:
                user_tas = {'institution': 'dev_staging_placeholder'}

        if user_obj and user_tas:
            creators_details.append({
                'nameType': 'Personal',
                'givenName': user_obj.first_name,
                'familyName': user_obj.last_name,
            })
            institutions.append(user_tas['institution'])
        elif author.get('fname') and author.get('lname'):
            creators_details.append({
                'nameType': 'Personal',
                'givenName': author['fname'],
                'familyName': author['lname'],
            })
            if 'inst' in author:
                institutions.append(author['inst'])
    institutions = set(institutions)
    return creators_details, institutions
