from agavepy.agave import AgaveException, Agave
from django.shortcuts import render, redirect
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.core.urlresolvers import reverse
from django.views.generic.base import View
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.workspace.tasks import JobSubmitError, submit_job
from designsafe.apps.licenses.models import LICENSE_TYPES, get_license_info
from designsafe.libs.common.decorators import profile as profile_fn
from designsafe.apps.api.views import BaseApiView
from requests import HTTPError
from urlparse import urlparse
from datetime import datetime
# import jsonify
import json
import six
import logging
import urllib

logger = logging.getLogger(__name__)

@login_required
def index(request):
    """Renders workspace endpoint.
        
        :param service: A HttpRequest object.
        :returns: index.html.
        """
    context = {
    }
    return render(request, 'designsafe/apps/workspace/index.html', context)


def _app_license_type(app_id):
    """Verifies if app has license.
        
        :param service: app id.
        :returns: "MATLAB" or "LS-DYNA" if in LICENSE_TYPES or None if not in LICENSE_TYPES.
        """
    app_lic_type = app_id.replace('-{}'.format(app_id.split('-')[-1]), '').upper()
    lic_type = next((t for t in LICENSE_TYPES if t in app_lic_type), None)
    return lic_type

class ApiService(BaseApiView):
    @profile_fn
    def get(self, request, service): # will monitors be removed?
        """Calls GET method.
        
        :param request: the HttpRequest object.
        :param service: the service called by user (apps, meta or jobs). 
        :returns: call to GET method on service (get_apps(), get_meta(), get_jobs()).
        """
        handler_name = 'get_{service}'.format(service=service)
        try:
            handler = getattr(self, handler_name) #self.get_apps
        except AttributeError as exc:
            logger.error(exc, exc_info=True)
            return HttpResponseBadRequest('No handler')

        logger.debug('handler: %s', handler)
        try:
            data = handler(service) #self.get_apps('apps)
        except HTTPError as e:
            logger.error('Failed to execute {0} API call due to HTTPError={1}'.format(
                service, e.message))
            return HttpResponse(json.dumps(e.message),
                                content_type='application/json',
                                status=400)
        except AgaveException as e:
            logger.error('Failed to execute {0} API call due to AgaveException={1}'.format(
                service, e.message))
            return HttpResponse(json.dumps(e.message), content_type='application/json',
                                status=400)
        except Exception as e:
            logger.error('Failed to execute {0} API call due to Exception={1}'.format(
                service, e))
            return HttpResponse(
                json.dumps({'status': 'error', 'message': '{}'.format(e.message)}),
                content_type='application/json', status=400)

        return HttpResponse(json.dumps(data, cls=DjangoJSONEncoder),
                            content_type='application/json')

    @profile_fn
    def post(self, request, service):
        """Calls POST method.

        :param request: the HttpRequest object.
        :param service: the service called by user (service can be meta or jobs).
        :returns: call to POST method on service (post_meta(), post_jobs()).
        """
        handler_name = 'post_{service}'.format(service=service)
        try:
            handler = getattr(self, handler_name)
        except AttributeError as exc:
            logger.error(exc, exc_info=True)
            return HttpResponseBadRequest('No handler')

        logger.debug('handler: %s', handler)
        try:
            data = handler(service)
            print ("************printing above handler data **************")
            print data
            print ("************printing below handler data **************")
        except JobSubmitError as e:
                data = e.json()
                logger.error('Failed to submit job {0}'.format(data)) # this is the error is raising a 500
                return HttpResponse(json.dumps(data),
                                    content_type='application/json',
                                    status=e.status_code)
        except HTTPError as e:
            logger.error('Failed to execute {0} API call due to HTTPError={1}'.format(
                service, e.message))
            return HttpResponse(json.dumps(e.message),
                                content_type='application/json',
                                status=400)
        except AgaveException as e:
            logger.error('Failed to execute {0} API call due to AgaveException={1}'.format(
                service, e.message))
            return HttpResponse(json.dumps(e.message), content_type='application/json',
                                status=400)
        except Exception as e:
            logger.error('Failed to execute {0} API call due to Exception={1}'.format(
                service, e), exc_info=True)
            return HttpResponse(
                json.dumps({'status': 'error', 'message': '{}'.format(e.message)}),
                content_type='application/json', status=400)

        return HttpResponse(json.dumps(data, cls=DjangoJSONEncoder),
                            content_type='application/json')
    @profile_fn
    def delete(self, request, service):
        """Calls DELETE method.
        
        :param request: the HttpRequest object.
        :param service: the service called by user (service can be meta or jobs).
        :returns: call to DELETE method on service (delete_meta(), delete_jobs())
        """
        handler_name = 'delete_{service}'.format(service=service)
        try:
            handler = getattr(self, handler_name)
        except AttributeError as exc:
            logger.error(exc, exc_info=True)
            return HttpResponseBadRequest('No handler')

        logger.debug('handler: %s', handler)
        try:
            data = handler(service) #self.get_apps('apps)
        except HTTPError as e:
            logger.error('Failed to execute {0} API call due to HTTPError={1}'.format(
                service, e.message))
            return HttpResponse(json.dumps(e.message),
                                content_type='application/json',
                                status=400)
        except AgaveException as e:
            logger.error('Failed to execute {0} API call due to AgaveException={1}'.format(
                service, e.message))
            return HttpResponse(json.dumps(e.message), content_type='application/json',
                                status=400)
        except Exception as e:
            logger.error('Failed to execute {0} API call due to Exception={1}'.format(
                service, e))
            return HttpResponse(
                json.dumps({'status': 'error', 'message': '{}'.format(e.message)}),
                content_type='application/json', status=400)

        return data

    def get_apps(self, service):
        """Gets apps service.
        
        :param service: apps.
        :returns: application object.
        """
        app_id = self.request.GET.get('app_id')
        # print app_id
        agv = self.request.user.agave_oauth.client # need to mock this client
        if app_id:
            data = agv.apps.get(appId=app_id)

            lic_type = _app_license_type(app_id)
            data['license'] = {
                'type': lic_type
            }
            if lic_type is not None:
                _, license_models = get_license_info()
                license_model = filter(lambda x: x.license_type == lic_type, license_models)[0]
                lic = license_model.objects.filter(user=self.request.user).first()
                data['license']['enabled'] = lic is not None

        else:

            public_only = self.request.GET.get('publicOnly')
            if public_only == 'true':
                data = agv.apps.list(publicOnly='true')
            else:
                data = agv.apps.list()

        return data

    def get_meta(self, service):
        """Lists and/or searchs metadata.
        
        :param service: meta.
        :returns: array of MetadataResponse object.
        """
        app_id = self.request.GET.get('app_id')
        agv = self.request.user.agave_oauth.client
        if app_id:
            data = agv.meta.get(appId=app_id)
    
            lic_type = _app_license_type(app_id)
            data['license'] = {
                'type': lic_type
            }
    
            if lic_type is not None:
                _, license_models = get_license_info()
                license_model = filter(lambda x: x.license_type == lic_type, license_models)[0]
                lic = license_model.objects.filter(user=self.request.user).first()
                data['license']['enabled'] = lic is not None

        else:
            query = self.request.GET.get('q')
            data = agv.meta.listMetadata(q=query)

        return data

    def post_meta(self, service):
        """Updates or adds new metadata.
        
        :param service: meta.
        :returns: A single Metadata object.
        """
        meta_post = self.request.POST.dict() # changed json.loads(self.request.body) for request.POST.dict()
        print " ############### I am printing above META_POST:"
        print meta_post
        print " ############### I am printing below META_POST:"
        meta_uuid = meta_post.get('uuid')
        agv = self.request.user.agave_oauth.client

        if meta_uuid:
            del meta_post['uuid']
            data = agv.meta.updateMetadata(uuid=meta_uuid, body=meta_post)
        else:
            data = agv.meta.addMetadata(body=meta_post)
          

        return data

    def delete_meta(self, service):
        """Removes metadata from system.
        
        :param service: meta.
        :returns: A single EmptyMetadata object.
        """
        meta_uuid = self.request.GET.get('uuid')
        agv = self.request.user.agave_oauth.client

        if meta_uuid:
            data = agv.meta.deleteMetadata(uuid=meta_uuid)
            print " ############### I am printing above data after DELETEMETADATA:"
            print data
            print " ############### I am printing below data after DELETEMETADATA:"

        return data

    def get_jobs(self, service):
        """Gets details of the job with specific job id.
        
        :param service: jobs.
        :returns: json object.
        """
        
        job_id = self.request.GET.get('job_id')
        agv = self.request.user.agave_oauth.client

        # get specific job info
        if job_id:
            data = agv.jobs.get(jobId=job_id)
            q = {"associationIds": job_id}
            job_meta = agv.meta.listMetadata(q=json.dumps(q))
            data['_embedded'] = {"metadata": job_meta}

            archive_system_path = '{}/{}'.format(data['archiveSystem'],
                                                        data['archivePath'])
            data['archiveUrl'] = reverse(
                'designsafe_data:data_depot')
            data['archiveUrl'] += 'agave/{}/'.format(archive_system_path)

            # list jobs
        else:
            limit = self.request.GET.get('limit', 10)
            offset = self.request.GET.get('offset', 0)
            data = agv.jobs.list(limit=limit, offset=offset)
        return data

    def post_jobs(self, service):
        """Submits a new job.
        
        :param service: jobs.
        :returns: A single job object.
        """
        job_post= json.loads(self.request.body)
        print job_post
        #converting multikey dictionary to regular dictionary
        # for key, values in job_post_query_dict.items():
        #     job_post_query_dict_key = key
        #     job_post = json.loads(job_post_query_dict_key)
            
       

        job_id = job_post.get('job_id')
        agv = self.request.user.agave_oauth.client

        # cancel job / stop job
        if job_id:
            data = agv.jobs.manage(jobId=job_id, body='{"action":"stop"}')

        # submit job
        elif job_post:

            # cleaning archive path value
            if 'archivePath' in job_post:
                parsed = urlparse(job_post['archivePath'])
                if parsed.path.startswith('/'):
                    # strip leading '/'
                    archive_path = parsed.path[1:]
                else:
                    archive_path = parsed.path

                if not archive_path.startswith(self.request.user.username):
                    archive_path = '{}/{}'.format(
                        self.request.user.username, archive_path)

                job_post['archivePath'] = archive_path

                if parsed.netloc:
                    job_post['archiveSystem'] = parsed.netloc
            else:
                job_post['archivePath'] = \
                    '{}/archive/jobs/{}/${{JOB_NAME}}-${{JOB_ID}}'.format(
                        self.request.user.username,
                        datetime.now().strftime('%Y-%m-%d'))

            # check for running licensed apps
            lic_type = _app_license_type(job_post['appId'])
            if lic_type is not None:
                _, license_models = get_license_info()
                license_model = filter(lambda x: x.license_type == lic_type, license_models)[0]
                lic = license_model.objects.filter(user=self.request.user).first()
                job_post['parameters']['_license'] = lic.license_as_str()

            # url encode inputs
            if job_post['inputs']:
                for key, value in six.iteritems(job_post['inputs']):
                    parsed = urlparse(value)
                    if parsed.scheme:
                        job_post['inputs'][key] = '{}://{}{}'.format(
                            parsed.scheme, parsed.netloc, urllib.quote(parsed.path))
                    else:
                        job_post['inputs'][key] = urllib.quote(parsed.path)

            data = submit_job(self.request, self.request.user.username, job_post) # catches JobSubmitError
        return data

    # else:
    #     return HttpResponse('Unexpected service: %s' % service, status=400)

    # 2 lines above: how to verify that user called a method different from delete, post or get job?

    def delete_jobs(self, service):
        """Gets details of job by job id and deletes job.
        
        :param service: jobs.
        :returns: String
        """
        job_id = self.request.GET.get('job_id')
        agv = self.request.user.agave_oauth.client
        data = agv.jobs.delete(jobId=job_id)
        return HttpResponse(json.dumps(data, cls=DjangoJSONEncoder),
                        content_type='application/json')


def process_notification(request, pk, **kwargs):
    """Redirects user.
        
        :param request: the HttpRequest object.
        :param pk: primary key.
        :returns: a redirect to target_path with archive_id info???
        """
    n = Notification.objects.get(pk=pk) #get notification 
    extra = n.extra_content
    logger.info('extra: {}'.format(extra))
    archiveSystem = extra['archiveSystem'] # add info about archiveSystem
    archivePath = extra['archivePath'] # add info about archivePath

    archive_id = '%s/%s' % (archiveSystem, archivePath) #set archive_id

    target_path = reverse('designsafe_data:data_depot') + 'agave/' + archive_id + '/'

    return redirect(target_path)
