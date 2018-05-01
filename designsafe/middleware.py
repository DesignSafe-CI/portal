"""Middlewares"""
import logging
import re
import os
import cProfile
import pstats
import time
import json
from django.contrib import messages
from django.conf import settings
from django.http import HttpResponse
from django.core.exceptions import MiddlewareNotUsed
from termsandconditions.middleware import (TermsAndConditionsRedirectMiddleware,
                                           is_path_protected)
from termsandconditions.models import TermsAndConditions

logger = logging.getLogger(__name__)

class DesignSafeSupportedBrowserMiddleware:
    def process_request(self, request):
        user_agent = request.META['HTTP_USER_AGENT']
        agent_is_supported = ('Chrome' in user_agent) or ('Firefox' in user_agent)

        if not agent_is_supported:
            messages.warning(request, '<h4>Unsupported Browser</h4>'
                                      'Your browser is not supported by DesignSafe. '
                                      'Please switch to <a href="https://www.google.com/chrome">Chrome</a> '
                                      'or <a href="https://www.mozilla.org/en-US/firefox/new/">Firefox</a> '
                                      'if you experience issues.')

class DesignSafeTermsMiddleware(TermsAndConditionsRedirectMiddleware):
    """
    This middleware is a customization of
    termsandconditions.middleware.TermsAndConditionsRedirectMiddleware. Instead of
    redirecting to the ACCEPT_TERMS_PATH it adds a notification on every page that the
    user has not accepted the latest terms of use.
    """

    def process_request(self, request):
        """Process each request to app to ensure terms have been accepted"""
        current_path = request.META['PATH_INFO']
        protected_path = is_path_protected(current_path)

        if request.user.is_authenticated and protected_path:
            for term in TermsAndConditions.get_active_list():
                if not TermsAndConditions.agreed_to_latest(request.user, term):
                    accept_url = getattr(settings, 'ACCEPT_TERMS_PATH',
                                         '/terms/accept/') + term
                    messages.warning(
                        request, '<h4>Please Accept the Terms of Use</h4>'
                                 'You have not yet agreed to the current Terms of Use. '
                                 'Please <a href="%s">CLICK HERE</a> to review and '
                                 'accept the Terms of Use.<br>Acceptance of the Terms of '
                                 'Use is required for continued use of DesignSafe '
                                 'resources.' % accept_url)
        return None

class RequestProfilingMiddleware(object):
    """Middleware to run cProfiler on each request"""

    def __init__(self, get_response=None):
        if settings.PORTAL_PROFILE:
            self.get_response = get_response
            stats_dirpath = os.path.join(os.path.dirname(__file__), '../stats')
            if not os.path.isdir(stats_dirpath):
                os.mkdir(stats_dirpath)
            self.stats_dirpath = stats_dirpath
            self.prfs = {}
            self.profile = None
        else:
            raise MiddlewareNotUsed

    def process_view(self, request, callback, callback_args, callback_kwargs):
        reqid = re.sub(r"\/", "-", request.path.strip('/'))
        self.prfs[reqid] = cProfile.Profile()
        #response = self.get_response(request)
        self.prfs[reqid].enable()
        args = (request,) + callback_args
        try:
            return callback(*args, **callback_args)
        except:
            return

    def process_response(self, request, response):
        reqid = re.sub(r"\/", "-", request.path.strip('/'))
        if not self.prfs.get(reqid):
            return response
        self.prfs[reqid].disable()
        prf = self.prfs[reqid]
        req_dirname = re.sub(r"\/", "-", request.path.strip('/'))
        req_dirpath = os.path.join(self.stats_dirpath, req_dirname)
        if not os.path.isdir(req_dirpath):
            os.mkdir(req_dirpath)
        currtime = str(time.time())
        prof_outpath = os.path.join(req_dirpath, currtime + '.prof')
        det_outpath = os.path.join(req_dirpath, currtime + '.json')
        self.prfs[reqid].dump_stats(prof_outpath)
        #with open(prof_outpath, 'w+') as flo:
        #    pstats.Stats(prf, stream=flo).sort_stats('cumtime', 'time')
        with open(det_outpath, 'w+') as flo:
            dets = {
                'path': request.path,
                'POST': request.POST.dict(),
                'GET': request.GET.dict(),
                'request': {
                    'CONTENT_LENGTH': request.META.get('CONTENT_LENGTH'),
                    'CONTENT_TYPE': request.META.get('CONTENT_TYPE')
                },
            }
            if getattr(response, 'META', None):
                dets['response'] = {
                    'CONTENT_LENGTH': response.META.get('CONTENT_LENGHT'),
                    'CONTENT_TYPE': response.META.get('CONTENT_TYPE')
                }
            json.dump(dets, flo, indent=2)
        return response
