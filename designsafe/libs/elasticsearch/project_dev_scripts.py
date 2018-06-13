from django.contrib.auth import get_user_model
from designsafe.apps.api.projects.models import Project
from designsafe.apps.projects.models.elasticsearch import IndexedProject
from elasticsearch_dsl.query import Q
import json


def make_populate():
    user = get_user_model().objects.get(username='jarosenb')
    ag = user.agave_oauth.client

    p1 = Project.list_projects(agave_client=ag)[0]

    p1_nolinks = {key:value for key,value in p1.iteritems() if key != '_links'}

    first = IndexedProject(p1_nolinks)

    first.save()


def create_or_update_project(client, uuid):
    project_search = IndexedProject.search().filter(
        Q({'term': 
            {'uuid._exact': '3689905702218559000-242ac11e-0001-012'}
        }))

    res = project_search.execute()

    if res.hits.total == 0:
        query = {'uuid': uuid}
        records = client.meta.listMetadata(q=json.dumps(query))
        project_info = dict(records[0])

        project_info_args = {key:value for key,value in project_info.iteritems() if key != '_links'}

        project_ES = IndexedProject(**project_info_args)

        project_ES.save()



