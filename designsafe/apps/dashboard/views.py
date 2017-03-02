from django.shortcuts import render
from django.contrib import messages
from django.contrib.auth import get_user_model, logout
from django.contrib.auth.decorators import login_required, permission_required
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render_to_response
from django.utils.translation import ugettext_lazy as _
from designsafe.apps.accounts import forms, integrations
from designsafe.apps.accounts.models import (NEESUser, DesignSafeProfile,
                                             NotificationPreferences)
from pytas.http import TASClient
from pytas.models import User as TASUser
import logging
import json
import re

logger = logging.getLogger(__name__)

@login_required
def index(request):

    """
    The default accounts view. Provides user settings for managing profile,
    authentication, notifications, identities, and applications.
    """
    django_user = request.user
    user_profile = TASUser(username=request.user.username)

    try:
        demographics = django_user.profile
    except ObjectDoesNotExist as e:
        logger.info('exception e:{} {}'.format(type(e), e))

    context = {
        'profile': user_profile,
    }
    return render(request, 'designsafe/apps/dashboard/index.html', context)
