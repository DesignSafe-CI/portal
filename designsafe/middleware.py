from django.contrib import messages
from django.conf import settings
from termsandconditions.middleware import (TermsAndConditionsRedirectMiddleware,
                                           is_path_protected)
from termsandconditions.models import TermsAndConditions
import logging

logger = logging.getLogger(__name__)


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

        if request.user.is_authenticated() and protected_path:
            for term in TermsAndConditions.get_active_list():
                if not TermsAndConditions.agreed_to_latest(request.user, term):
                    accept_url = getattr(settings, 'ACCEPT_TERMS_PATH',
                                         '/terms/accept/') + term
                    messages.warning(
                        request, '<h4>Please Accept the Terms of Use</h4>'
                                 'You have not yet agreed to the current Terms of Use. '
                                 'Please <a href="%s">CLICK HERE</a> to review and '
                                 'accept the Terms of Use.<br>Acceptance of the Terms of '
                                 'Use is required for continued use of DesignSafe-CI '
                                 'resources.' % accept_url)
        return None

