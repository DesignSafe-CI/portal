"""Views for Onboarding"""

from django.views.generic.base import TemplateView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.decorators import login_required


@method_decorator(login_required, name="dispatch")
class OnboardingView(TemplateView):
    """Onboarding View"""

    template_name = "designsafe/apps/onboarding/index.html"

    @method_decorator(ensure_csrf_cookie)
    def dispatch(self, request, *args, **kwargs):
        """Overwrite dispatch to ensure csrf cookie"""
        return super(OnboardingView, self).dispatch(request, *args, **kwargs)
