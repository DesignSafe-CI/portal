from __future__ import absolute_import

from celery import shared_task, task
from designsafe.celery import app

from agavepy.agave import Agave, AgaveException

import logging
import requests
import json

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.http import HttpResponse
from django.conf import settings
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)


@shared_task
def watch_job_status(data):
    username = data['username']
    job_id = data['job_id']
    current_status = data.get('current_status', None)
    try:
        user = get_user_model().objects.get(username=username)
        if user.agave_oauth.expired:
            user.agave_oauth.refresh()
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=user.agave_oauth.token['access_token'])
        job = ag.jobs.get(jobId=job_id)
        job_status = job['status']

        if 'retry' in data:
            # clear out any past retries
            del data['retry']

        if job_status in ['FINISHED', 'FAILED']:
            # index job output
            logger.debug('JOB FINALIZED: id=% status=%s' % (job_id, job_status))
        elif current_status and current_status == job_status:
            # DON'T notify, but still queue another watch task
            watch_job_status.apply_async(args=[data], countdown=10)
        else:
            # notify and queue another watch task
            logger.debug('JOB STATUS CHANGE: id=% status=%s' % (job_id, job_status))
            data['current_status'] = job_status
            watch_job_status.apply_async(args=[data], countdown=10)
    except ObjectDoesNotExist:
        logger.exception('Unable to locate local user account: %s' % username)
    except (AgaveException, RequestException):
        if 'retry' in data:
            logger.exception('Agave API error. Retry failed. Aborting.')
        else:
            logger.warning('Agave API error. Retrying...')
            data['retry'] = True
            watch_job_status.apply_async(args=[data], countdown=10)


@app.task
def submit_job(request, agave, job_post):
    logger.info('submitting job: {0}'.format(job_post))

    # subscribe to notifications
    # notify_url = request.build_absolute_uri(reverse('jobs_webhook'))
    # query = 'uuid=${UUID}&status=${STATUS}&job_id=${JOB_ID}&event=${EVENT}' \
    #         '&system=${JOB_SYSTEM}&job_name=${JOB_NAME}&job_owner=${JOB_OWNER}'
    # notify = {
    #     'url': '%s?%s' % (notify_url, query),
    #     'event': '*',
    #     'persistent': True
    # }
    # if 'notifications' in job_post:
    #     job_post['notifications'].append(notify)
    # else:
    #     job_post['notifications'] = [notify]

    try:
        response = agave.jobs.submit(body=job_post)

        task_data = {
            'username': request.user.username,
            'job_id': response['id']
        }
        watch_job_status.apply_async(args=[task_data], countdown=10)
    except (requests.exceptions.ConnectionError, requests.exceptions.HTTPError) as e:
        logger.info('Task HTTPError: {}'.format(e.__class__))
        submit_job.retry(exc=e("Agave is currently down. Your job will be submitted when "
                               "it returns."), max_retries=None)
    logger.info('agave response: {}'.format(response))

    # subscribe_job_notification(request, agave, str(response.id))
    # mock_agave_notification() #for testing

    return response


@app.task
def subscribe_job_notification(request, agave, job_id):
    # mock_agave_notification() #for testing
    url=request.build_absolute_uri(reverse('jobs_webhook'))+'?uuid=${UUID}&status=${STATUS}&job_id=${JOB_ID}&event=${EVENT}&system=${JOB_SYSTEM}&job_name=${JOB_NAME}&job_owner=${JOB_OWNER}'
    logger.info('job notification url: {}'.format(url))

    d = {
        # "url" : "http://requestb.in/p8rlbtp8?uuid=${UUID}&status=${STATUS}&job_id=${JOB_ID}&event=${EVENT}&system=${JOB_SYSTEM}&job_name=${JOB_NAME}&job_owner=${JOB_OWNER}",
        "url" : url,
        "event" : "*",
        "associatedUuid" : job_id,
        "persistent": True
    }

    try:
      subscribe = agave.notifications.add(body=json.dumps(d))
    except (requests.exceptions.ConnectionError, requests.exceptions.HTTPError) as e:
        logger.debug('Job Notification Subscription Task HTTPError {0}: {1}'.format(e.response.status_code, e.__class__))
        submit_job.retry(exc=e("Agave is currently down. Your notification will be created when it returns."), max_retries=None)

    logger.info('agave subs: {}'.format(subscribe))


#just for testing
def mock_agave_notification():
    import requests
    r = requests.post('http://192.168.99.100:8000/webhooks/jobs/', data={"job_id":'1234512345', "event":"test", "job_name":'test name', "job_owner": 'mlm55', "status":"test status", "archivePath":"test/path"})
