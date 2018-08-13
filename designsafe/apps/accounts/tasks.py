import csv
import StringIO
import logging
from django.conf import settings
from agavepy.agave import Agave, AgaveException
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
   
    notification_list = get_user_model().objects.filter(
            Q(notification_preferences__isnull=True) |
            Q(**{"notification_preferences__{}".format(list_name): True}))

    try:

        logger.info(
            "Creating user report for user=%s on "
            "default storage systemId=%s",
            username,
            settings.AGAVE_STORAGE_SYSTEM
        )
        csv_file = StringIO.StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(["User Email","First Name","Last Name","Phone Number","Institution ID",\
            "Username","Country of residence","Bio","Website","Orcid_id","Professional Level",\
            "Research Activities","NH_interests","Ethnicity","Gender","Citizenship",\
            ])

        for user in notification_list:
            user_profile = TASUser(username=user)
            designsafe_user = get_user_model().objects.get(username=user)
            if hasattr(designsafe_user, "profile"):

                writer.writerow([user_profile.email,\
                    user_profile.firstName.encode('utf-8') if user_profile.firstName else user_profile.firstName,\
                    user_profile.lastName.encode('utf-8') if user_profile.lastName else user_profile.lastName,\
                    user_profile.phone,\
                    user_profile.institutionId,\
                    user_profile,\
                    user_profile.country,\
                    designsafe_user.profile.bio.encode('utf-8') if designsafe_user.profile.bio else designsafe_user.profile.bio,\
                    designsafe_user.profile.website.encode('utf-8') if designsafe_user.profile.website else designsafe_user.profile.website,\
                    designsafe_user.profile.orcid_id.encode('utf-8') if designsafe_user.profile.orcid_id else designsafe_user.profile.orcid_id,\
                    designsafe_user.profile.professional_level,\
                    # making queryset into list
                    list(designsafe_user.profile.research_activities.all()) if designsafe_user.profile.research_activities.all() else None,\
                    list(designsafe_user.profile.nh_interests.all()) if designsafe_user.profile.nh_interests.all() else None,\
                    designsafe_user.profile.ethnicity,\
                    designsafe_user.profile.gender,\
                    user_profile.citizenship,\
                ])


        # ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
        #            token=settings.AGAVE_SUPER_TOKEN)
        # setattr(csv_file, 'name', 'user_report.csv')
        #ag.files.importData(
        #    filePath=username,
        #    fileName='user_report.csv',
        #    systemId=settings.AGAVE_STORAGE_SYSTEM,
        #    fileToUpload=csv_file
        #    )
        logger.debug('report contents: %s', csv_file.getvalue())
        csv_file.close()

    except (HTTPError, AgaveException):
        logger.exception('Failed to create user report.',
                         extra={'user': username,
                                'systemId': settings.AGAVE_STORAGE_SYSTEM})

