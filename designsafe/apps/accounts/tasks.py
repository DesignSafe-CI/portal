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
   

    try:
        # # this code works to get attributes values out of the DesignsafeProfile class
        # logger.info("I am priting from tasks on Friday")
        # user = get_user_model().objects.get(username=username)
        # user_profile = user.profile
        # logger.debug("here is user profile:{}".format(user_profile))
        # my_bio = user_profile.bio.encode('utf-8') if user_profile.bio else user_profile.bio
        # logger.debug("here is the bio: {}".format(my_bio))
        # logger.debug("I am passed bio priting")
        # 

        # # this code works to get attributes values out of the TASUser class
        logger.info("I am priting from tasks on Friday morning")
        user_profile = TASUser(username=username)
        logger.debug("here is user profile:{}".format(user_profile))
        my_last_name = user_profile.lastName.encode('utf-8') if user_profile.lastName else user_profile.lastName
        logger.debug("here is the last name: {}".format(my_last_name))
        my_first_name = user_profile.firstName.encode('utf-8') if user_profile.firstName else user_profile.firstName
        logger.debug("here is the first name: {}".format(my_first_name))
        logger.debug("I got to last line")    


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

