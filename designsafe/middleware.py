"""Middlewares."""
import logging
import re
import os
import pstats
import cProfile
import time
import json
from django.contrib import messages
from django.conf import settings
from django.core.exceptions import MiddlewareNotUsed
from termsandconditions.middleware import (TermsAndConditionsRedirectMiddleware,
                                           is_path_protected)
from termsandconditions.models import TermsAndConditions

LOG = logging.getLogger(__name__)


class DesignSafeSupportedBrowserMiddleware:  # pylint: disable=too-few-public-methods
    """Check if the user is running Chrome or Firefox and  flash a warning otherwise."""

    def __init__(self, get_response):
        """Init."""
        self.get_response = get_response

    def __call__(self, request):
        """Call middleware."""
        user_agent = request.META['HTTP_USER_AGENT']
        agent_is_supported = ('Chrome' in user_agent) or ('Firefox' in user_agent)

        if not agent_is_supported:
            messages.warning(
                request,
                '<h4>Unsupported Browser</h4>'
                'Your browser is not supported by DesignSafe. '
                'Please switch to <a href="https://www.google.com/chrome">Chrome</a> '
                'or <a href="https://www.mozilla.org/en-US/firefox/new/">Firefox</a> '
                'if you experience issues.')
        return self.get_response(request)


class DesignSafeTermsMiddleware(
        TermsAndConditionsRedirectMiddleware
):  # pylint: disable=too-few-public-methods
    """Custom terms and condition middleware.

    This middleware is a customization of
    termsandconditions.middleware.TermsAndConditionsRedirectMiddleware. Instead of
    redirecting to the ACCEPT_TERMS_PATH it adds a notification on every page that the
    user has not accepted the latest terms of use.
    """

    def __init__(self, get_response):
        """Init."""
        self.get_response = get_response
        super().__init__(get_response)

    def __call__(self, request):
        """Process each request to app to ensure terms have been accepted."""
        current_path = request.META['PATH_INFO']
        protected_path = is_path_protected(current_path)

        if request.user.is_authenticated and protected_path:
            if TermsAndConditions.get_active_terms_not_agreed_to(request.user):
                accept_url = getattr(settings, 'ACCEPT_TERMS_PATH',
                                     '/terms/accept/')
                messages.warning(
                    request, '<h4>Please Accept the Terms of Use</h4>'
                             'You have not yet agreed to the current Terms of Use. '
                             'Please <a href="%s">CLICK HERE</a> to review and '
                             'accept the Terms of Use.<br>Acceptance of the Terms of '
                             'Use is required for continued use of DesignSafe '
                             'resources.' % accept_url)
        return self.get_response(request)


class RequestProfilingMiddleware:
    """Middleware to run cProfiler on each request."""

    def __init__(self, get_response):
        """Init."""
        self.get_response = get_response
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
        """Enable profiler before Django calls the view func/class."""
        reqid = re.sub(r"\/", "-", request.path.strip('/'))
        self.prfs[reqid] = cProfile.Profile()
        self.prfs[reqid].enable()
        args = (request,) + callback_args
        return callback(*args, **callback_args)

    def __call__(self, request):
        """Will stop profiler initalized by :meth:`process_view`.

        Each middleware is called, in order, once before calling the view
        and then again, in reverse order, when returning the response.
        This middleware defines a :meth:`process_view` which initializes
        a profiler right before the view is called.
        Then, when Django is returning the response, after the view has
        been called, this method stops the profiler and writes the output
        to a file.
        """
        reqid = re.sub(r"\/", "-", request.path.strip('/'))

        if not self.prfs.get(reqid):
            return self.get_response(request)

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
        response = self.get_response(request)
        with open(prof_outpath, 'w+') as flo:
            pstats.Stats(prf, stream=flo).sort_stats('cumtime', 'time')
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
            flo.write(json.dump(dets, flo, indent=2))
        return response
