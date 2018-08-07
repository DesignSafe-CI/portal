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
   

    try:
        csv_file = StringIO.StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(["UserEmail","FirstName","LastName","PhoneNumber","Institution",\
            # "UserName","Country","Bio","Website","Orcid_id","Professional Level",\
            # "Research Activities","NH_interests","Ethnicity","Gender","Citizenship",\
            ])

        notification_list = get_user_model().objects.filter(
            Q(notification_preferences__isnull=True) |
            Q(**{"notification_preferences__{}".format(list_name): True}))
        for user in notification_list:
            user_profile = TASUser(username=user)
            designsafe_user = get_user_model().objects.get(username=user)
          
            designsafe_username = get_user_model().objects.get(username=username)
        
            logger.debug("here is extended info for designsafe username.profile:{}".format(designsafe_username.profile.bio.encode('utf-8') if designsafe_username.profile.bio else designsafe_username.profile.bio))
            logger.debug("here is extended info for designsafe user.profile:{}".format(designsafe_user.profile.bio.encode('utf-8') if designsafe_user.profile.bio else designsafe_user.profile.bio))
            



            writer.writerow([user_profile.email,\
                user_profile.firstName.encode('utf-8') if user_profile.firstName else user_profile.firstName,\
                user_profile.lastName.encode('utf-8') if user_profile.lastName else user_profile.lastName,\
                user_profile.phone,\
                user_profile.institutionId,\
                # designsafe_profile_user.bio.encode('utf-8') if designsafe_profile_user.bio else designsafe_profile_user.bio,\
            ])

  


        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=settings.AGAVE_SUPER_TOKEN)
        setattr(csv_file, 'name', 'user_report.csv')
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

