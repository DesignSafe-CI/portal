from __future__ import absolute_import

from celery import shared_task, task

from agavepy.agave import Agave, AgaveException

import logging
import requests
import json

from django.http import HttpResponse
logger = logging.getLogger(__name__)

@task
def submit_job(agave, job_post):
    logger.info('submitting job: {0}'.format(job_post))

    try:
      response=agave.jobs.submit(body=job_post)
    except (requests.exceptions.ConnectionError, requests.exceptions.HTTPError) as e:
        logger.info('Task HTTPError: {}'.format(e.__class__))
        submit_job.retry(exc=e("Agave is currently down. Your job will be submitted when it returns."), max_retries=None)

    return response
