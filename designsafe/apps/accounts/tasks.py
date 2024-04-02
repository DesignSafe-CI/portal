import csv
import io
import logging
from django.conf import settings
# from agavepy.agave import Agave, AgaveException
from celery import shared_task
from requests import HTTPError
from django.contrib.auth import get_user_model
from pytas.models import User as TASUser
from django.db.models import Q
from designsafe.apps.accounts.models import (DesignSafeProfile,
                                             NotificationPreferences)


logger = logging.getLogger(__name__)

@shared_task(default_retry_delay=1*30, max_retries=3)
def create_report(username, list_name):
    """
    This task runs a celery task that creates a report of all DesignSafe users.
    It pulls data from both TAS and the Django user model, writes them to a CSV, and
    imports the CSV to the top-level of the user's My Data directory.
    """

    user_list = get_user_model().objects.all()

    try:

        logger.info(
            "Creating user report for user=%s on "
            "default storage systemId=%s",
            username,
            settings.AGAVE_STORAGE_SYSTEM
        )
        csv_file = io.StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(["Last Name","First Name","Email","Phone Number","Institution",\
            "Title", "Professional Level","Bio","NH_interests","Research Activities","Username",\
            "Ethnicity","Gender","Country of residence","Citizenship","Date Account Created",\
            ])

        for user in user_list:
            if user.username == 'EF-UF':
                writer.writerow(['Unable to find user data for username "' +
                                 user.username + '"', ])
                continue
            try:
                user_profile = TASUser(username=user)
                designsafe_user = get_user_model().objects.get(username=user)

                if hasattr(designsafe_user, "profile"):

                    #making nh_interests QuerySet into list
                    interests = designsafe_user.profile.nh_interests.all().values('description')
                    nh_interests = [interest['description'] for interest in interests]

                    #making research_activities QuerySet into list
                    activities = designsafe_user.profile.research_activities.all().values('description')
                    research_activities = [activity['description'] for activity in activities]

                    # order of items as required by user
                    writer.writerow([user_profile.lastName if user_profile.lastName else user_profile.lastName,
                        user_profile.firstName if user_profile.firstName else user_profile.firstName,
                        user_profile.email,
                        user_profile.phone,
                        user_profile.institution,
                        user_profile.title,
                        designsafe_user.profile.professional_level,
                        designsafe_user.profile.bio if designsafe_user.profile.bio else designsafe_user.profile.bio,
                        nh_interests if nh_interests else None,
                        research_activities if research_activities else None,
                        user_profile,
                        designsafe_user.profile.ethnicity,
                        designsafe_user.profile.gender,
                        user_profile.country,
                        user_profile.citizenship,
                        designsafe_user.date_joined.date()
                    ])
                else:
                    writer.writerow(['Unable to find user data for username "' +
                                     user.username + '"', ])
            except:
                continue

        User = get_user_model().objects.get(username=username)
        client = User.agave_oauth.client

        setattr(csv_file, 'name', 'user_report.csv')
        client.files.importData(
           filePath=username,
           fileName='user_report.csv',
           systemId=settings.AGAVE_STORAGE_SYSTEM,
           fileToUpload=csv_file
           )

        csv_file.close()

    except (HTTPError, AgaveException):
        logger.exception('Failed to create user report.',
                         extra={'user': username,
                                'systemId': settings.AGAVE_STORAGE_SYSTEM})
