from django.shortcuts import render, render_to_response
from django.conf import settings
from django.contrib.auth.decorators import login_required

import logging
import json

import os
from agavepy.agave import Agave
from django.http import HttpResponse
# import dateutil.parser
# from bson import Binary, Code
#from bson import dumps

logger = logging.getLogger(__name__)

# Create your views here.
@login_required
def index(request):
    context = {}
    token_key = getattr(settings, 'AGAVE_TOKEN_SESSION_ID')
    if token_key in request.session:
        context['session'] = {
            'agave': json.dumps(request.session[token_key])
        }
    return render(request, 'designsafe/apps/workspace/index.html', context)

@login_required
def get_template(request, resource):
    """
      Returns a template.
    """
    #TODO: Should be replaced by TemplateView(template='template') or a subclass of that.
    #TODO: Should use login_required?
    logger.info('Template requested: {0}.html'.format(resource))
    templateUrl = 'designsafe/apps/workspace/{0}.html'.format(resource)
    return render_to_response(templateUrl)