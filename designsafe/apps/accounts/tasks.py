import csv
import StringIO
import logging
from django.conf import settings
from agavepy.agave import Agave, AgaveException
from celery import shared_task
from requests import HTTPError
from django.contrib.auth import get_user_model
from designsafe.apps.accounts.models import (DesignSafeProfile,
                                             NotificationPreferences)


logger = logging.getLogger(__name__)

@shared_task(default_retry_delay=1*30, max_retries=3)
def create_report(username):

    try:
        # user = get_user_model.objects.get(username=username) # am I gonna use user?
        logger.info(
            "Creating user report for user=%s on "
            "default storage systemId=%s",
            username,
            settings.AGAVE_STORAGE_SYSTEM
        )
        csv_file = StringIO.StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(["UserEmail","FirstName","LastName","PhoneNumber","Institution",\
            "UserName","Country","Bio","Website","Orcid_id","Professional Level",\
            "Research Activities","NH_interests","Ethnicity","Gender","Citizenship"])

        writer.writerow(['imaginaryuser@gmail.com',\
                    'Image',\
                    'Nare',\
                    '12345',\
                    'UT',\
                    'imaginaryuser',\
                    'US',\
                    'loves to read',\
                    'myfakesite.com',\
                    '12345',\
                    'staff',\
                    'many',\
                    'many',\
                    'Asian',\
                    'female',\
                    'France',\
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

