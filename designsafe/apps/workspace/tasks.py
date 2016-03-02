from __future__ import absolute_import

from celery import shared_task, task
from designsafe.celery import app
from designsafe.apps.signals.signals import generic_event
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
        job_name = job['name']

        event_data = {
            'job_name': job_name,
            'job_id': job['id'],
            'event': job_status,
            'status': job_status,
            'archive_path': job['archivePath'],
            'job_owner': job['owner'],
            'html': [
                {'Job Name': job_name},
                {'Status': job_status},
            ]
        }

        if 'retry' in data:
            # clear out any past retries
            del data['retry']

        if job_status in ['FINISHED', 'FAILED']:
            # job finished, no additional tasks; notify
            logger.debug('JOB FINALIZED: id=%s status=%s' % (job_id, job_status))
            if job_status == 'FINISHED':
                db_hash = job['archivePath'].replace(job['owner'], '')
                event_data['action_link']={'label': 'View Output', 'value': '%s#%s' % (reverse('designsafe_data:my_data'), db_hash)}

            generic_event.send_robust(None, event_type='job', event_data=event_data,
                                      event_users=[username])
        elif current_status and current_status == job_status:
            # DO NOT notify, but still queue another watch task
            watch_job_status.apply_async(args=[data], countdown=10)
        else:
            # queue another watch task
            data['current_status'] = job_status
            watch_job_status.apply_async(args=[data], countdown=10)
            # notify
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))
            generic_event.send_robust(None, event_type='job', event_data=event_data,
                                      event_users=[username])
    except ObjectDoesNotExist:
        logger.exception('Unable to locate local user account: %s' % username)
    except (AgaveException, RequestException):
        retries = data.get('retry', 0) + 1
        data['retry'] = retries
        logger.warning('Agave API error. Retry number %s...' % retries)
        watch_job_status.apply_async(args=[data], countdown=10*retries)


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
        logger.info('Task HTTPError {0}: {1}'.format(e.response.status_code, e.__class__))
        submit_job.retry(exc=e("Agave is currently down. Your job will be submitted when "
                               "it returns."), max_retries=None)
    logger.info('agave response: {}'.format(response))

    return response


@app.task
def subscribe_job_notification(request, agave, job_id):
    url=request.build_absolute_uri(reverse('jobs_webhook'))+'?uuid=${UUID}&status=${STATUS}&job_id=${JOB_ID}&event=${EVENT}&system=${JOB_SYSTEM}&job_name=${JOB_NAME}&job_owner=${JOB_OWNER}'
    logger.info('job notification url: {}'.format(url))

    d = {
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
