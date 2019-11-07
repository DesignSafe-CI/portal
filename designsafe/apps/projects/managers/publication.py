"""Publication Manager.

.. module:: designsafe.apps.project.managers.datacite
    :synopsis: Python interface to Datacite's rest API.
        Visit: https://support.datacite.org/docs/api for more info.
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from pytas.http import TASClient
from designsafe.apps.api.agave import service_account
from designsafe.apps.projects.managers import datacite as DataciteManager
from designsafe.apps.projects.managers.base import ProjectsManager
from designsafe.libs.elasticsearch.docs.publications import BaseESPublication


LOG = logging.getLogger(__name__)
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
    "designsafe.project.field_recon.report": "reports",
}


def draft_publication(
    project_id,
    main_entity_uuid=None,
    project_doi=None,
    main_entity_doi=None,
    upsert_project_doi=False,
    upsert_main_entity_doi=True,
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
    - If :param:`project_id` is given **but** :param:`main_entity_uuid` is ``None``
    then a project DOI will be created or updated.

    .. warning:: This funciton only creates a *Draft* DOI and not a public one.

    .. warning:: An entity *might* have multiple DOIs, if this is the case and
    :param:`upsert_project_doi` or :param:`upsert_main_entity_doi` are set to True
    then *all* saved dois will be updated.

    .. note:: In theory a single resource *should not* have multiple DOIs
    but we don't know how this will change in the future, hence, we are
    supporting multiple DOIs.

    .. note:: If no :param:`main_entity_uuid` is given then a project DOI will be
    created.

    :param str project_id: Project Id
    :param str main_entity_uuid: Uuid of main entity.
    :param str project_doi: Custom doi for project.
    :param str main_entity_doi: Custom doi for main entity.
    :param bool upsert_project_doi: Update or insert project doi.
    :param bool upsert_main_entity_doi: Update or insert main entity doi.
    """
    mgr = ProjectsManager(service_account())
    prj = mgr.get_project_by_id(project_id)
    entity = None
    if main_entity_uuid:
        entity = mgr.get_entity_by_uuid(main_entity_uuid)
    else:
        upsert_project_doi = True

    responses = []
    prj_url = TARGET_BASE.format(project_id=project_id)
    if entity:
        entity_url = ENTITY_TARGET_BASE.format(
            project_id=project_id,
            entity_uuid=main_entity_uuid
        )
    prj_datacite_json = prj.to_datacite_json()
    prj_datacite_json['url'] = prj_url
    if entity:
        ent_datacite_json = entity.to_datacite_json()
        ent_datacite_json['url'] = entity_url

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

    if entity and upsert_main_entity_doi and main_entity_doi:
        me_res = DataciteManager.create_or_update_doi(
            ent_datacite_json,
            main_entity_doi
        )
        entity.dois += [main_entity_doi]
        entity.dois = list(set(entity.dois))
        entity.save(service_account())
        responses.append(me_res)
    elif entity and upsert_main_entity_doi and entity.dois:
        for doi in entity.dois:
            me_res = DataciteManager.create_or_update_doi(
                ent_datacite_json,
                doi
            )
            responses.append(me_res)
    elif entity and upsert_main_entity_doi and not entity.dois:
        me_res = DataciteManager.create_or_update_doi(
            ent_datacite_json
        )
        entity.dois += [me_res['data']['id']]
        entity.save(service_account())
        responses.append(me_res)

    for res in responses:
        LOG.info(
            "DOI created or updated: %(doi)s",
            {"doi": res['data']['id']}
        )
    return responses


def publish_resource(project_id, entity_uuid=None):
    """Publish a resource.

    Retrieves a project and/or an entity and set any saved DOIs
    as published. If no DOIs are saved in the specified project or entity
    it will fail silently. We need to specify the project id because
    this function also changes the status of the locally saved publication
    to `"published"` that way it shows up in the published listing.

    :param str project_id: Project Id to publish.
    :param str entity_uuid: Entity uuid to publish.
    """
    mgr = ProjectsManager(service_account())
    prj = mgr.get_project_by_id(project_id)
    entity = None
    if entity_uuid:
        entity = mgr.get_entity_by_uuid(entity_uuid)
    responses = []
    for doi in prj.dois:
        res = DataciteManager.publish_doi(doi)
        responses.append(res)

    if entity:
        for doi in entity.dois:
            res = DataciteManager.publish_doi(doi)
            responses.append(res)

    pub = BaseESPublication(project_id=project_id)
    pub.update(status='published')

    for res in responses:
        LOG.info(
            "DOI published: %(doi)s",
            {"doi": res['data']['id']}
        )
    return responses


def _populate_entities_in_publication(entity, publication):
    """Populate entities in publication dict.

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
            LOG.exception(
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


def _transform_authors(entity, publication):
    """Transform authors.

    :param dict entity: Entity dictionary.
    :param dict publication: Publication dictionary.
    """
    entity['value']['authors'] = []
    for author in publication['authors']:
        if author.get('guest', False):
            continue
        user = None
        try:
            user = get_user_model().objects.get(username=author.get('name'))
        except ObjectDoesNotExist:
            LOG.exception(
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


def freeze_project_and_entity_metadata(project_id, entity_uuid=None):
    """Freeze project and entity metadata.

    Given a project id and an entity uuid (should be a main entity) this function
    retrieves all metadata related to these entities and stores it into Elasticsearch
    as :class:`~designafe.libs.elasticsearch.docs.publications.BaseESPublication`

    :param str project_id: Project id.
    :param str entity_uuid: Entity uuid.
    """
    mgr = ProjectsManager(service_account())
    prj = mgr.get_project_by_id(project_id)
    entity = None
    if entity_uuid:
        entity = mgr.get_entity_by_uuid(entity_uuid)
        entity_json = entity.to_body_dict()

    pub_doc = BaseESPublication(project_id=project_id)
    publication = pub_doc.to_dict()

    if entity:
        pub_entities_field_name = FIELD_MAP[entity.name]
        publication['authors'] = entity_json['value']['authors'][:]
        entity_json['authors'] = []

        _populate_entities_in_publication(entity, publication)
        _transform_authors(entity_json, publication)

        publication[pub_entities_field_name] = [
            sobj for sobj in publication[pub_entities_field_name]
            if sobj['uuid'] != entity.uuid
        ]
        if entity_json['value']['dois']:
            entity_json['doi'] = entity_json['value']['dois'][-1]

        _delete_unused_fields(entity_json)
        publication[pub_entities_field_name].append(entity_json)

    prj_json = prj.to_body_dict()
    _delete_unused_fields(prj_json)

    award_number = publication.get('project', {}).get('value', {}).pop(
        'awardNumber', []
    ) or []

    if not isinstance(award_number, list):
        award_number = []

    prj_json['value']['awardNumbers'] = award_number
    prj_json['value'].pop('awardNumber', None)
    if publication.get('project'):
        publication['project'].update(prj_json)
    else:
        publication['project'] = prj_json

    pub_doc.update(**publication)
    return pub_doc
