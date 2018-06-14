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


def index_or_update_project(client, body):
    project_search = IndexedProject.search().filter(
        Q({'term': 
            {'uuid._exact': body['uuid']}
        })
    )
    res = project_search.execute()

    if res.hits.total == 0:
        # Create an ES record for the new metadata.
        # project_info_args = {key:value for key,value in project_info.iteritems() if key != '_links'}

        project_ES = IndexedProject(**body)
        project_ES.save()

    elif res.hits.total == 1:
        # Update the record.

        doc = res[0]
        doc.update(**body)

    else:
        # If we're here we've somehow indexed the same project multiple times. 
        # Delete all records and replace with the metadata passed to the task.
        
        for doc in res:
            doc.delete()

        project_ES = IndexedProject(**body) 
        project_ES.save()

         




