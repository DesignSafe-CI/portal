from django.shortcuts import render
from django.contrib.auth.decorators import login_required, permission_required
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)


@login_required
def index(request):
    """
    The default accounts view. Provides user settings for managing profile,
    authentication, notifications, identities, and applications.
    """
    return render(request, "designsafe/apps/dashboard/index.html")
