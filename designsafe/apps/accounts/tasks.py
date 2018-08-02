import csv
import StringIO
import logging
from django.conf import settings
from agavepy.agave import Agave, AgaveException
from celery import shared_task
from requests import HTTPError
from django.contrib.auth import get_user_model
from pytas.models import User as TASUser
from designsafe.apps.accounts.models import (DesignSafeProfile,
                                             NotificationPreferences)


logger = logging.getLogger(__name__)

@shared_task(default_retry_delay=1*30, max_retries=3)
def create_report(username):

    user_profile = TASUser(username=username)
   

    try:
        
        logger.info(
            "Creating user report for user=%s on "
            "default storage systemId=%s",
            username,
            settings.AGAVE_STORAGE_SYSTEM
        )
        csv_file = StringIO.StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(["UserEmail","FirstName","LastName","PhoneNumber",\
            "Institution","UserName","Country","Citizenship"])
        if username == user_profile:
            writer.writerow([user_profile.email,\
                user_profile.firstName.encode('utf-8') if user_profile.firstName else user_profile.firstName,\
                user_profile.lastName.encode('utf-8') if user_profile.lastName else user_profile.lastName,\
                user_profile.phone.encode('utf-8') if user_profile.phone else user_profile.phone,\
                user_profile.institution.encode('utf-8') if user_profile.institution else user_profile.institution,\
                user_profile.country,\
                user_profile.citizenship])       


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

