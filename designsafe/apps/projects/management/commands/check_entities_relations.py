"""Management command to delete null entity relations"""
import six
import json
import logging
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from requests.exceptions import HTTPError
from designsafe.apps.projects.models.agave.base import Project
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.projects.models.utils import lookup_model

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Removes any invalid relation from a project's entities

    In most projects there is the concept of relations between entitites,
    e.g. Models -> Sensor Info -> Events or Sim Model -> Input -> Output.
    If a parent entity is deleted without first deleting any relation to
    a child entity then the child entity will endup with an invalid
    pointer to a non-existent entity. This needs to be deleted aumtomatically.

    Since entities are agave metadata records (mongo documents) there is no
    automatic deletion of these relations. Relations are managed by
    using `associationIds` array. When an entity is saved Agave (or mongo)
    checks every UUID in `associationIds` and if any UUID is invalid an
    error is raised.
    """

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.prj = None
        self.client = None

    def add_arguments(self, parser):
        parser.add_argument('project_id', help="Shold be an Agave UUID or PRJ-[0-9]+")

    def get_client(self):
        self.client = get_service_account_client()
        return self.client

    def get_project(self, project_id):
        client = self.get_client()
        res = []
        if project_id.startswith('PRJ-'):
            res = client.meta.listMetadata(q=json.dumps(
                {"value.projectId": project_id}))
            #prj = Project._meta.model_manager.get(client, project_id=project_id)
        else:
            #prj = Project._meta.model_manager.get(client, uuid=options.get('project_id'))
            res = client.meta.getMetadata(uuid=project_id)

        if len(res):
            cls = lookup_model(res[0])
            prj = cls(**res[0])
            self.prj = prj
            return prj
        else:
            raise ValueError('No project found')

    def get_related_entities_names(self):
        rels = []
        for attrname in self.prj._meta._reverse_fields:
            attr = getattr(self.prj, attrname, None)
            if attr and attr.related_obj_name != 'designsafe.file':
                rels.append(attr.related_obj_name)
        return rels

    def _delete_relations(self, ent, uuids):
        for attrname, field in six.iteritems(ent._meta._related_fields):
            attr = getattr(ent, attrname)
            #self.stdout.write('uuids before: %s' % attr.uuids)
            #self.stdout.write('ascs before: %s' % ascs)
            attr.uuids = [uuid for uuid in attr.uuids if uuid not in uuids]
            #self.stdout.write('uuids after: %s' % attr.uuids)
            #self.stdout.write('ascs after: %s' % ascs)
        ent.association_ids = [uuid for uuid in ent.association_ids if uuid not in uuids]
        ent.save(self.client)

    def _check_related_uuids(self, ent):
        uuids = []
        for attrname, field in six.iteritems(ent._meta._related_fields):
            if attrname == 'files':
                continue

            attr = getattr(ent, attrname)
            for uuid in getattr(attr, 'uuids', []):
                try:
                    self.client.meta.getMetadata(uuid=uuid)
                except HTTPError as e:
                    self.stdout.write(e.response.text)
                    uuids.append(uuid)
            #self.stdout.write('uuids: %s' % uuids)
        none_files = [x for x in ent._links.associationIds if x['href'] is None]
        file_uuids = [nfl['rel'] for nfl in none_files]
        uuids += file_uuids
        if len(uuids):
            self._delete_relations(ent, uuids)

    def handle(self, *args, **options):
        project_id = options.get('project_id', '').upper()
        prj = self.get_project(project_id)
        #self.stdout.write('getting entities')
        rel_names = self.get_related_entities_names()
        #self.stdout.write('rel_names: %s' % rel_names)
        entities = self.client.meta.listMetadata(q=json.dumps(
            {'name': {'$in': rel_names}, 'associationIds': prj.uuid}))
        self.stdout.write('entities length: %d' % len(entities))
        for entity in entities:
            cls = lookup_model(entity)
            ent = cls(**entity)
            self.stdout.write('Entity: %s' % ent.uuid)
            self._check_related_uuids(ent)
            #self.stdout.write('%s: %s' % (attrname, fld.uuids))
