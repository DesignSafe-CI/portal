"""Command to print NSF report"""
import six
import json
import csv
import logging
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from requests.exceptions import HTTPError
from designsafe.apps.api.agave import get_service_account_client

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Returns a csv file with necessary details for report"""

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.client = None

    def add_arguments(self, parser):
        parser.add_argument(
            'output',
            help="Output filepath",
            default='report.csv'
        )

    def get_client(self):
        self.client = get_service_account_client()
        return self.client

    def get_projects(self):
        query = {
            "name": "designsafe.project"
        }
        projects = []
        offset = 0
        limit = 100
        finished = False
        while not finished:
            projects = self.client.meta.listMetadata(
                q=json.dumps(query),
                offset=offset,
                limit=limit
            )
            self.stdout.write(str(len(projects)))
            for project in projects:
                yield project

            offset += limit
            if not len(projects):
                finished = True

    def user_full_name(self, username):
        try:
            user = get_user_model().objects.get(
                username=username
            )
            return '{last_name}, {first_name}'.format(
                last_name=user.last_name.decode('utf-8'),
                first_name=user.first_name.decode('utf-8')
            )
        except ObjectDoesNotExist:
            return username

    def handle(self, *args, **options):
        filepath = options.get('output')
        self.get_client()
        with open(filepath, 'wb') as _file:
            writer = csv.writer(
                _file,
                delimiter='|')
            writer.writerow([
                "Project Type",
                "Project ID",
                "Title",
                "Associated Projects",
                "PI",
                "Co-PIs",
                "Team Members",
                "Award Number",
                "Date Created"
            ])
            for project in self.get_projects():
                row = []
                row.append(project.value.get('projectType', 'N/A'))
                row.append(project.value.get('projectId', '-'))
                row.append(project.value.get('title', 'N/A').decode('utf-8'))
                ascs = project.value.get('associatedProjects', [])
                if len(ascs):
                    row.append(
                        ', '.join(
                            ['{title}:{href}'.format(
                                title=asc.get('title', '-').decode('utf-8'),
                                href=asc.get('href', '-').decode('utf-8')
                            ) for asc in ascs]
                        )
                    )
                else:
                    row.append('-')
                pi = project.value.get('pi', '')
                pi_str = '-'
                if pi:
                    pi_str = self.user_full_name(pi)
                row.append(pi_str)
                co_pis = project.value.get('coPis', ['-'])
                co_pis_str = ', '.join(
                    [self.user_full_name(
                        co_pi
                    ) for co_pi in co_pis]
                )
                row.append(co_pis_str)
                team_members = project.value.get(
                    'teamMember',
                    project.value.get(
                        'teamMembers',
                        ['-']
                    )
                )
                team_members_str = ', '.join(
                    [self.user_full_name(
                        team_member
                    ) for team_member in team_members]
                )
                row.append(team_members_str)
                award_numbers = project.value.get('awardNumber', '-')
                award_number = ''
                if isinstance(award_numbers, list):
                    for number in award_numbers:
                        award_number += '{name} - {number}'.format(
                            name=number.get('name', '').decode('utf-8'),
                            number=number.get('number', '').decode('utf-8')
                        )
                else:
                    award_number = award_numbers
                row.append(award_number)
                row.append(project.created)
                writer.writerow([data for data in row])
