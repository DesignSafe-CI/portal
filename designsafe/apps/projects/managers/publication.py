"""Publication Manager.

.. module:: designsafe.apps.project.managers.datacite
    :synopsis: Python interface to Datacite's rest API.
        Visit: https://support.datacite.org/docs/api for more info.
"""

from html.entities import entitydefs
import os
import json
import zipfile
import logging
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from pytas.http import TASClient
from designsafe import settings
from designsafe.apps.api.agave import service_account
from designsafe.apps.data.models.agave.files import BaseFileResource
from designsafe.apps.data.models.elasticsearch import IndexedPublication
from designsafe.apps.projects.managers import datacite as DataciteManager
from designsafe.apps.projects.managers.base import ProjectsManager
from designsafe.apps.projects.models.utils import lookup_model
from designsafe.libs.elasticsearch.docs.publications import BaseESPublication
from designsafe.libs.elasticsearch.utils import new_es_client


logger = logging.getLogger(__name__)
TARGET_BASE = 'https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{project_id}'
ENTITY_TARGET_BASE = 'https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{project_id}/#details-{entity_uuid}'
FIELD_MAP = {
    "designsafe.project.analysis": "analysisList",
    "designsafe.project.model_config": "modelConfigs",
    "designsafe.project.sensor_list": "sensorLists",
    "designsafe.project.event": "eventsList",
    "designsafe.project.report": "reportsList",
    "designsafe.project.experiment": "experimentsList",
    "designsafe.project.simulation": "simulations",
    "designsafe.project.simulation.model": "models",
    "designsafe.project.simulation.input": "inputs",
    "designsafe.project.simulation.output": "outputs",
    "designsafe.project.simulation.analysis": "analysiss",
    "designsafe.project.simulation.report": "reports",
    "designsafe.project.hybrid_simulation": "hybrid_simulations",
    "designsafe.project.hybrid_simulation.global_model": "global_models",
    "designsafe.project.hybrid_simulation.coordinator": "coordinators",
    "designsafe.project.hybrid_simulation.sim_substructure": "sim_substructures",
    "designsafe.project.hybrid_simulation.exp_substructure": "exp_substructures",
    "designsafe.project.hybrid_simulation.coordinator_output": "coordinator_outputs",
    "designsafe.project.hybrid_simulation.sim_output": "sim_outputs",
    "designsafe.project.hybrid_simulation.exp_output": "exp_outputs",
    "designsafe.project.hybrid_simulation.analysis": "analysiss",
    "designsafe.project.hybrid_simulation.report": "reports",
    "designsafe.project.field_recon.mission": "missions",
    "designsafe.project.field_recon.collection": "collections",
    "designsafe.project.field_recon.social_science": "socialscience",
    "designsafe.project.field_recon.planning": "planning",
    "designsafe.project.field_recon.geoscience": "geoscience",
    "designsafe.project.field_recon.report": "reports",
}

UNAMENDABLE_FIELDS = { # review
    'project': [
        'pi',
        'coPis',
        'teamMembers',
        'guestMembers',
        'projectId',
        'projectType',
        'title',
        'teamOrder',
        'fileTags',
        'dois'
    ],
    'entity': [
        'title',
        'dois',
        'authors',
        'fileTags',
        'files',
        'project'
    ],
    'subentity': [
        'project',
        'experiments',
        'modelConfigs',
        'sensorLists',
        'files'
    ]
}


def draft_publication(
    project_id,
    main_entity_uuids=None,
    project_doi=None,
    main_entity_doi=None,
    upsert_project_doi=False,
    upsert_main_entity_doi=True,
    revision=None,
    revised_authors=None
):
    """Reserve a publication.

    A publication is reserved by creating a DOI through Datacite.
    For some of the projects a DOI is only created for the main entity
    e.g. Mission or Simulation. For some other projects we also (or only)
    get a DOI for the project.
    - If :param:`project_doi` and/or :param:`main_entity_doi` values are given
    then those dois will be updated (or created if they don't exist in datacite).
    - If :param:`upsert_project_doi` and/or :param:`upsert_main_entity_doi` are
    set to `True` then any saved DOIs will be updated (even if there's multiple
    unless a specific DOI is given). If there are no saved DOIs then a new DOI
    will be created. Meaning, it will act as update or insert.
    - If :param:`project_id` is given **but** :param:`main_entity_uuids` is ``None``
    then a project DOI will be created or updated.

    .. warning:: This funciton only creates a *Draft* DOI and not a public one.

    .. warning:: An entity *might* have multiple DOIs, if this is the case and
    :param:`upsert_project_doi` or :param:`upsert_main_entity_doi` are set to True
    then *all* saved dois will be updated.

    .. note:: In theory a single resource *should not* have multiple DOIs
    but we don't know how this will change in the future, hence, we are
    supporting multiple DOIs.

    .. note:: If no :param:`main_entity_uuids` is given then a project DOI will be
    created.

    :param str project_id: Project Id
    :param list main_entity_uuids: uuid strings of main entities.
    :param str project_doi: Custom doi for project.
    :param str main_entity_doi: Custom doi for main entity.
    :param bool upsert_project_doi: Update or insert project doi.
    :param bool upsert_main_entity_doi: Update or insert main entity doi.
    """
    mgr = ProjectsManager(service_account())
    prj = mgr.get_project_by_id(project_id)
    responses = []

    if main_entity_uuids:
        ### Draft Entity DOI(s) ###
        pub = BaseESPublication(project_id=project_id, revision=revision)
        for ent_uuid in main_entity_uuids:
            entity = mgr.get_entity_by_uuid(ent_uuid)
            if entity:
                if revision:
                    entity_url = ENTITY_TARGET_BASE.format(
                        project_id='{}v{}'.format(project_id, revision),
                        entity_uuid=ent_uuid
                    )
                    original_entities = getattr(pub, FIELD_MAP[entity.name])
                    pub_ent = next(ent for ent in original_entities if ent.uuid == ent_uuid)

                    entity.title = pub_ent.value.title
                    entity.authors = revised_authors[ent_uuid]
                else:
                    entity_url = ENTITY_TARGET_BASE.format(
                        project_id=project_id,
                        entity_uuid=ent_uuid
                    )
                ent_datacite_json = entity.to_datacite_json(prj)
                ent_datacite_json['url'] = entity_url
                # ent_datacite_json['version'] = str(revision) # omitting version number per Maria

                if upsert_main_entity_doi and main_entity_doi:
                    me_res = DataciteManager.create_or_update_doi(
                        ent_datacite_json,
                        main_entity_doi
                    )
                    entity.dois += [main_entity_doi]
                    entity.dois = list(set(entity.dois))
                    entity.save(service_account())
                    responses.append(me_res)
                elif upsert_main_entity_doi and entity.dois:
                    for doi in entity.dois:
                        me_res = DataciteManager.create_or_update_doi(
                            ent_datacite_json,
                            doi
                        )
                        responses.append(me_res)
                elif upsert_main_entity_doi and not entity.dois:
                    me_res = DataciteManager.create_or_update_doi(
                        ent_datacite_json
                    )
                    entity.dois += [me_res['data']['id']]
                    entity.save(service_account())
                    responses.append(me_res)
    else:
        ### Draft Project DOI ###
        upsert_project_doi = True
        if revision:
            # Versions should not update certain fields
            # Add version number to DataCite info
            prj_url = TARGET_BASE.format(project_id='{}v{}'.format(project_id, revision))
            pub = BaseESPublication(project_id=project_id, revision=revision)
            prj.title = pub.project.value.title
            prj.team_order = pub.project.value.teamOrder
            if revised_authors:
                prj.team_order = revised_authors
            prj_datacite_json = prj.to_datacite_json(prj)
            prj_datacite_json['url'] = prj_url
            prj_datacite_json['version'] = str(revision)
            # append links to previous versions in DOI...
            relatedIdentifiers = []
            for ver in range(1, revision):
                id = '{}v{}'.format(project_id, ver) if ver!=1 else project_id
                relatedIdentifiers.append(
                    {
                    'relatedIdentifierType': 'URL',
                    'relationType': 'IsNewVersionOf',
                    'relatedIdentifier': TARGET_BASE.format(project_id=id),
                    }
                )
            prj_datacite_json['relatedIdentifiers'] = relatedIdentifiers
        else:
            # format project for publication
            prj_url = TARGET_BASE.format(project_id=project_id)
            prj_datacite_json = prj.to_datacite_json(prj)
            prj_datacite_json['url'] = prj_url


    if upsert_project_doi and project_doi:
        prj_res = DataciteManager.create_or_update_doi(
            prj_datacite_json,
            project_doi
        )
        prj.dois += [project_doi]
        prj.dois = list(set(prj.dois))
        prj.save(service_account())
        responses.append(prj_res)
    elif upsert_project_doi and prj.dois:
        for doi in prj.dois:
            prj_res = DataciteManager.create_or_update_doi(
                prj_datacite_json,
                doi
            )
            responses.append(prj_res)
    elif upsert_project_doi and not prj.dois:
        prj_res = DataciteManager.create_or_update_doi(prj_datacite_json)
        prj.dois += [prj_res['data']['id']]
        prj.save(service_account())
        responses.append(prj_res)

    for res in responses:
        logger.info(
            "DOI created or updated: %(doi)s",
            {"doi": res['data']['id']}
        )
    return responses

def amend_publication(project_id, amendments=None, authors=None, revision=None):
    """Amend a Publication
    
    Update Amendable fields on a publication and the corresponding DataCite
    records. These changes do not produce a new version of a publication, but
    they do allow for limited changes to a published project. 
    
    :param str project_id: Project uuid to amend
    :param int revision: Revision number to amend
    """
    es_client = new_es_client()
    mgr = ProjectsManager(service_account())
    prj = mgr.get_project_by_id(project_id)
    pub = BaseESPublication(project_id=project_id, revision=revision, using=es_client)

    prj_dict = prj.to_body_dict()
    pub_dict = pub.to_dict()
    _delete_unused_fields(prj_dict)

    if pub.project.value.projectType != 'other':
        pub_entity_uuids = pub.entities()
        for uuid in pub_entity_uuids:
            if uuid in amendments:
                entity = amendments[uuid]
            else:
                entity = mgr.get_entity_by_uuid(uuid)
                entity = entity.to_body_dict()
            _delete_unused_fields(entity)

            for pub_ent in pub_dict[FIELD_MAP[entity['name']]]:
                if pub_ent['uuid'] == entity['uuid']:
                    for key in entity['value']:
                        ent_type = 'entity' if 'dois' in entity['value'] else 'subentity'
                        if key not in UNAMENDABLE_FIELDS[ent_type]:
                            pub_ent['value'][key] = entity['value'][key]
                    if 'authors' in entity['value']:
                        pub_ent['value']['authors'] = authors[entity['uuid']]
                        _set_authors(pub_ent, pub_dict)
            
    # weird key swap for old issues with awardnumber(s)
    award_number = prj.award_number or []
    if not isinstance(award_number, list):
        award_number = []
    prj_dict['value']['awardNumbers'] = award_number
    prj_dict['value'].pop('awardNumber', None)
    if 'nhEventStart' in prj_dict['value'] and prj_dict['value']['nhEventStart'] == '':
        del prj_dict['value']['nhEventStart']
    if 'nhEventEnd' in prj_dict['value'] and prj_dict['value']['nhEventEnd'] == '':
        del prj_dict['value']['nhEventEnd']

    for key in prj_dict['value']:
        if key not in UNAMENDABLE_FIELDS['project']:
            pub_dict['project']['value'][key] = prj_dict['value'][key]
    if authors and prj_dict['value']['projectType'] == 'other':
        pub_dict['project']['value']['teamOrder'] = authors

    pub.update(**pub_dict)
    IndexedPublication._index.refresh(using=es_client)
    return pub


def amend_datacite_doi(publication):
    """Amend a citation on DataCite
    
    Use the published project to update the DOI on Datacite
    
    Note: This assumes that the DOI being updated is related to the project.
    We may want to change this to accept dict objects which are being amended.
    
    :param elasticsearch publication: Publication to amend
    """
    pub_dict = publication.to_dict()
    project_type = pub_dict['project']['value']['projectType']
    mgr = ProjectsManager(service_account())
    prj = mgr.get_project_by_id(pub_dict['project_id'])

    if project_type == 'other':
        prj_class = lookup_model(pub_dict['project'])
        project = prj_class(value=pub_dict['project']['value'], uuid=pub_dict['project']['uuid'])
        prj_datacite_json = project.to_datacite_json(project={})
        prj_doi = project.dois[0]
        DataciteManager.create_or_update_doi(prj_datacite_json, prj_doi)
    else:
        for field in publication.entity_keys(publishable=True):
            for ent in pub_dict[field]:
                ent_class = lookup_model(ent)
                entity = ent_class(value=ent['value'], uuid=ent['uuid'])
                entity.authors = ent['authors'] # swap author formats before creating json
                ent_datacite_json = entity.to_datacite_json(prj)
                ent_doi = entity.dois[0]
                DataciteManager.create_or_update_doi(ent_datacite_json, ent_doi)


def publish_resource(project_id, entity_uuids=None, publish_dois=False, revision=None):
    """Publish a resource.

    Retrieves a project and/or an entity and set any saved DOIs
    as published. If no DOIs are saved in the specified project or entity
    it will fail silently. We need to specify the project id because
    this function also changes the status of the locally saved publication
    to `"published"` that way it shows up in the published listing.

    If publish_dois is False Datacite will keep the newly created DOIs in
    "DRAFT" status, and not "PUBLISHED". A DOI on DataCite can only be
    deleted if it is in "DRAFT" status. Once a DOI is set to "PUBLISHED"
    or "RESERVED" it can't be deleted.

    :param str project_id: Project Id to publish.
    :param list entity_uuids: list of str Entity uuids to publish.
    :param int revision: Revision number to publish.
    """
    es_client = new_es_client()

    # If revision number passed, set status to "published" for specified revision and
    # set status to "revised" for old versions
    mgr = ProjectsManager(service_account())
    prj = mgr.get_project_by_id(project_id)
    responses = []

    if publish_dois:
        if entity_uuids:
            for ent_uuid in entity_uuids:
                entity = None
                if ent_uuid:
                    entity = mgr.get_entity_by_uuid(ent_uuid)

                if entity:
                    for doi in entity.dois:
                        res = DataciteManager.publish_doi(doi)
                        responses.append(res)

        for doi in prj.dois:
            res = DataciteManager.publish_doi(doi)
            responses.append(res)

    pub = BaseESPublication(project_id=project_id, revision=revision, using=es_client)
    pub.update(status='published', using=es_client)
    IndexedPublication._index.refresh(using=es_client)

    if revision:
        # Revising a publication sets the status of the previous document to 'archived'
        last_revision = revision - 1 if revision > 2 else 0
        archived_pub = BaseESPublication(project_id=project_id, revision=last_revision)
        archived_pub.update(status='archived')

    for res in responses:
        logger.info(
            "DOI published: %(doi)s",
            {"doi": res['data']['id']}
        )
    return responses


def _set_related_entities(entity, publication):
    """Populate sub entities in publication dict

    :param entity: Entity resource instance.
    :param dict publication: Publication dict.
    """
    mgr = ProjectsManager(service_account())

    reverse_field_attrs = entity._meta._reverse_fields
    reverse_fields = []
    for attr in reverse_field_attrs:
        try:
            field = getattr(entity, attr)
        except AttributeError:
            logger.exception(
                "No field '%(attr)s' in '%(ent)s'",
                {"attr": attr, "ent": entity}
            )
        reverse_fields.append(field.rel_cls.model_name)

    for field_name in reverse_fields:
        for pent in publication.get(FIELD_MAP[field_name], []):
            ent = mgr.get_entity_by_uuid(pent['uuid'])
            ent_dict = ent.to_body_dict()
            _delete_unused_fields(ent_dict)
            pent.update(ent_dict)


def _set_authors(entity, publication):
    """Transform authors.

    :param dict entity: Entity dictionary.
    :param dict publication: Publication dictionary.
    Sets authors on the entity to a list of string usernames within 'value'
    Sets authors on the entity to a list of user objects
    Sets authors on the publication
    """
    publication['authors'] = list(entity['value']['authors'])
    entity['value']['authors'] = []
    entity['authors'] = []
    for author in publication['authors']:
        if author.get('guest', False):
            continue
        user = None
        try:
            user = get_user_model().objects.get(username=author.get('name'))
        except ObjectDoesNotExist:
            logger.exception(
                "Error retrieving user: %(user)s",
                {"user": author.get('name')}
            )
        if not user:
            continue

        entity['value']['authors'].append(author.get('name'))
        author['lname'] = user.last_name
        author['fname'] = user.first_name
        author['email'] = user.email
        user_tas = TASClient().get_user(username=user.username)
        author['inst'] = user_tas.get('institution')
    entity['authors'] = publication['authors']


def _delete_unused_fields(dict_obj):
    """Delete unused fields.

    Mainly fields that end with `_set` or start with `_`.
    :param dict dict_obj: Dict to update.
    """
    keys_to_delete = []
    for key in dict_obj:
        if key.endswith('_set'):
            keys_to_delete.append(key)
        if key.startswith('_ui'):
            continue
        if key.startswith('_'):
            keys_to_delete.append(key)

    for key in keys_to_delete:
        dict_obj.pop(key, '')



def _preserve_project_values(original_pub, updated_entity, revised_authors):
    """Preserve Values for new Version
    Some metadata values are not meant to be modified
    when publishing a new version of a project. To prevent
    changes when publishing new versions, we'll copy those
    values from the original publication.
    """    
    preservables = ['title', 'pi', 'coPis', 'teamMembers', 'guestMembers']
    if updated_entity['name'] == 'designsafe.project':
        original_prj = original_pub.project.to_dict()
        for field in preservables:
            if field in original_prj['value']:
                updated_entity['value'][field] = original_prj['value'][field]
            elif field in updated_entity['value']:
                del updated_entity['value'][field]
    else:
        original_entities = getattr(original_pub, FIELD_MAP[updated_entity['name']])
        for orig_ent in original_entities:
            orig_ent = orig_ent.to_dict()
            if orig_ent['uuid'] == updated_entity['uuid']:
                for field in preservables:
                    if field in orig_ent['value']:
                        updated_entity['value'][field] = orig_ent['value'][field]
                    elif field in updated_entity['value']:
                        del updated_entity['value'][field]
    if original_pub.project.value.projectType == 'other':
        updated_entity['value']['teamOrder'] = revised_authors
    elif updated_entity['name'] != 'designsafe.project':
        updated_entity['value']['authors'] = revised_authors[updated_entity['uuid']]


def fix_file_tags(project_id, revision=None):
    es_client = new_es_client()
    pub = BaseESPublication(project_id=project_id, revision=revision, using=es_client)
    pub_dict = pub.to_dict()

    entities_to_check = list(set(pub_dict.keys()).intersection(list(FIELD_MAP.values())))
    entities_to_check.append('project')

    def check_complete_tags(tags):
        for tag in tags:
            if 'path' not in tag:
                return False
        return True

    def fix_tags_path(entity):
        for tag in entity['value']['fileTags']:
            try:
                pub_base = "{}v{}".format(project_id, revision) if revision else project_id
                pub_file = BaseFileResource.listing(
                    service_account(),
                    system="designsafe.storage.published",
                    path="{}{}".format(pub_base, tag['path'])
                )
                tag['fileUuid'] = pub_file.uuid
            except Exception as err:
                logger.info('error: {}'.format(err))
                continue

    def fix_tags_no_path(entity):
        if entity['name'] == 'designsafe.project':
            proj_other = BaseFileResource.listing(service_account(), system="project-{}".format(entity['uuid']), path="")
            for child in proj_other.children:
                try:
                    pub_base = "{}v{}".format(project_id, revision) if revision else project_id
                    pub_file = BaseFileResource.listing(service_account(), system="designsafe.storage.published", path="{}{}".format(pub_base, child.path))
                    proj_file = BaseFileResource.listing(service_account(), system="project-{}".format(entity['uuid']), path=child.path)
                    for tag in entity['value']['fileTags']:
                        if tag['fileUuid'] == proj_file.uuid:
                            tag['fileUuid'] = pub_file.uuid
                    
                except Exception as err:
                    logger.info('error: {}'.format(err))
                    continue
        else:
            for fobj in entity['fileObjs']:
                try:
                    pub_base = "{}v{}".format(project_id, revision) if revision else project_id
                    pub_file = BaseFileResource.listing(service_account(), system="designsafe.storage.published", path="{}{}".format(pub_base, fobj['path']))
                    proj_file = BaseFileResource.listing(service_account(), system="project-{}".format(pub_dict['project']['uuid']), path=fobj['path'])
                    for tag in entity['value']['fileTags']:
                        if tag['fileUuid'] == proj_file.uuid:
                            tag['fileUuid'] = pub_file.uuid
                    
                except Exception as err:
                    logger.info('error: {}'.format(err))
                    continue

    for entname in entities_to_check:
        if type(pub_dict[entname]) == list:
            for entity in pub_dict[entname]:
                if 'value' in entity and 'fileTags' in entity['value'] and check_complete_tags(entity['value']['fileTags']):
                    fix_tags_path(entity)
                elif 'value' in entity and 'fileTags' in entity['value']:
                    fix_tags_no_path(entity)
        else:
            if 'value' in pub_dict[entname] and 'fileTags' in pub_dict[entname]['value'] and check_complete_tags(pub_dict[entname]['value']['fileTags']):
                fix_tags_path(pub_dict[entname])
            elif 'value' in pub_dict[entname] and 'fileTags' in pub_dict[entname]['value']:
                fix_tags_no_path(pub_dict[entname])

    pub.update(using=es_client, **pub_dict)
    IndexedPublication._index.refresh(using=es_client)


def archive(project_id, revision=None):
    """Archive Published Files and Metadata

    When given a project_id, this function will copy and compress all of the published files
    for a project, and it will also include a formatted json document of the published metadata.
    Note: This metadata file is will only be used until the Fedora system is set up again.
    """

    es_client = new_es_client()
    pub = BaseESPublication(project_id=project_id, revision=revision, using=es_client)
    if revision:
        archive_prefix = '{}v{}'.format(pub.projectId, revision)
    else:
        archive_prefix = pub.projectId
    archive_name = '{}_archive.zip'.format(archive_prefix)
    metadata_name = '{}_metadata.json'.format(archive_prefix)
    pub_dir = settings.DESIGNSAFE_PUBLISHED_PATH
    arc_dir = os.path.join(pub_dir, 'archives/')
    archive_path = os.path.join(arc_dir, archive_name)
    metadata_path = os.path.join(arc_dir, metadata_name)

    def set_perms(dir, octal, subdir=None):
        try:
            os.chmod(dir, octal)
            if subdir:
                if not os.path.isdir(subdir):
                    raise Exception('subdirectory does not exist!')
                for root, dirs, files in os.walk(subdir):
                    os.chmod(root, octal)
                    for d in dirs:
                        os.chmod(os.path.join(root, d), octal)
                    for f in files:
                        os.chmod(os.path.join(root, f), octal)
        except Exception as e:
            logger.exception("Failed to set permissions for {}".format(dir))
            os.chmod(dir, 0o555)

    # compress published files into a zip archive
    def create_archive():
        arc_source = os.path.join(pub_dir, archive_prefix)

        try:
            logger.debug("Creating archive for {}".format(archive_prefix))
            zf = zipfile.ZipFile(archive_path, mode='w', allowZip64=True)
            for dirs, _, files in os.walk(arc_source):
                for f in files:
                    if f == archive_name:
                        continue
                    zf.write(os.path.join(dirs, f), os.path.join(dirs.replace(pub_dir, ''), f))
            zf.write(metadata_path, metadata_name)
            zf.close()
        except Exception as e:
            logger.exception("Archive creation failed for {}".format(arc_source))
        finally:
            set_perms(pub_dir, 0o555, arc_source)
            set_perms(arc_dir, 0o555)

    # create formatted metadata for user download
    def create_metadata():
        mgr = ProjectsManager(service_account())
        pub_dict = pub._wrapped.to_dict()
        prj = mgr.get_project_by_id(pub_dict['project_id'])
        meta_dict = {}

        entity_type_map = {
            'experimental': 'experimentsList',
            'simulation': 'simulations',
            'hybrid_simulation': 'hybrid_simulations',
            'field_recon': 'missions', # TODO: this should support 'reports' as well (aka Documents)
        }

        project_uuid = pub_dict['project']['uuid']
        try:
            logger.debug("Creating metadata for {}".format(archive_prefix))
            if pub_dict['project']['value']['projectType'] in entity_type_map:
                ent_type = entity_type_map[pub_dict['project']['value']['projectType']]
                entity_uuids = []
                if ent_type in pub_dict.keys():
                    entity_uuids = [x['uuid'] for x in pub_dict[ent_type]]
                meta_dict = mgr.get_entity_by_uuid(project_uuid).to_datacite_json(prj)
                meta_dict['published_resources'] = []
                meta_dict['url'] = TARGET_BASE.format(project_id=pub_dict['project_id'])
                for uuid in entity_uuids:
                    entity = mgr.get_entity_by_uuid(uuid)
                    ent_json = entity.to_datacite_json(prj)
                    ent_json['doi'] = entity.dois[0]
                    ent_json['url'] = ENTITY_TARGET_BASE.format(
                        project_id=pub_dict['project_id'],
                        entity_uuid=uuid
                    )
                    meta_dict['published_resources'].append(ent_json)
            else:
                project = mgr.get_entity_by_uuid(project_uuid)
                meta_dict = project.to_datacite_json(prj)
                meta_dict['doi'] = project.dois[0]
                meta_dict['url'] = TARGET_BASE.format(project_id=pub_dict['project_id'])

            with open(metadata_path, 'w') as meta_file:
                json.dump(meta_dict, meta_file)
        except:
            logger.exception("Failed to create metadata!")

    try:
        set_perms(pub_dir, 0o755, os.path.join(pub_dir, archive_prefix))
        set_perms(arc_dir, 0o755)
        create_metadata()
        create_archive()
    except Exception as e:
        logger.exception('Failed to archive publication!')


def freeze_project_and_entity_metadata(project_id, entity_uuids=None, revision=None, revised_authors=None):
    """Freeze project and entity metadata.

    Given a project id and an entity uuid (should be a main entity) this function
    retrieves all metadata related to these entities and stores it into Elasticsearch
    as :class:`~designafe.libs.elasticsearch.docs.publications.BaseESPublication`

    When publishing for the first time or publishing over an existing publication. We
    will clear any existing entities (if any) from the published metadata. We'll use entity_uuids
    (the entities getting DOIs) to rebuild the rest of the publication. These entities
    usually do not have files associated to them (except published reports/documents).

    :param str project_id: Project id.
    :param list of entity_uuid strings: Entity uuids.
    """
    es_client = new_es_client()
    mgr = ProjectsManager(service_account())
    prj = mgr.get_project_by_id(project_id)
    pub_doc = BaseESPublication(project_id=project_id, revision=revision, using=es_client)
    original_pub = BaseESPublication(project_id=project_id) if revised_authors else None
    publication = pub_doc.to_dict()
    print(publication)

    if entity_uuids:
        # clear any existing sub entities in publication and keep updated fileObjs
        fields_to_clear = []
        entities_with_files = []
        for key in list(FIELD_MAP.keys()):
            if FIELD_MAP[key] in list(publication.keys()):
                fields_to_clear.append(FIELD_MAP[key])
        fields_to_clear = set(fields_to_clear)

        for field in fields_to_clear:
            for ent in publication[field]:
                if 'fileObjs' in ent:
                    entities_with_files.append(ent)
                if ent['uuid'] in entity_uuids:
                    publication[field] = []

        for ent_uuid in entity_uuids:
            entity = None
            entity = mgr.get_entity_by_uuid(ent_uuid)

            if entity:
                entity_dict = entity.to_body_dict()
                pub_entities_field_name = FIELD_MAP[entity.name]

                for e in entities_with_files:
                    if e['uuid'] == entity_dict['uuid']:
                        entity_dict['fileObjs'] = e['fileObjs']

                _set_related_entities(entity, publication)
                _delete_unused_fields(entity_dict)

                if entity_dict['value']['dois']:
                    entity_dict['doi'] = entity_dict['value']['dois'][-1]
                    if revision:
                        _preserve_project_values(original_pub, entity_dict, revised_authors)
                _set_authors(entity_dict, publication)
                publication[pub_entities_field_name].append(entity_dict)
    
    prj_dict = prj.to_body_dict()
    _delete_unused_fields(prj_dict)
    if revision:
        _preserve_project_values(original_pub, prj_dict, revised_authors)

    award_number = prj.award_number or []

    if not isinstance(award_number, list):
        award_number = []

    prj_dict['value']['awardNumbers'] = award_number
    prj_dict['value'].pop('awardNumber', None)
    if 'nhEventStart' in prj_dict['value'] and prj_dict['value']['nhEventStart'] == '':
        del prj_dict['value']['nhEventStart']
    if 'nhEventEnd' in prj_dict['value'] and prj_dict['value']['nhEventEnd'] == '':
        del prj_dict['value']['nhEventEnd']
    if publication.get('project'):
        publication['project'].update(prj_dict)
    else:
        publication['project'] = prj_dict

    pub_doc.update(using=es_client, **publication)
    IndexedPublication._index.refresh(using=es_client)
    return pub_doc
