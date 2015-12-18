from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
#from dsapi.agave.files import *
import logging

logger = logging.getLogger(__name__)

# Create your views here.
def get_template(request, resource):
    """
      Returns a template.
    """
    #TODO: Should be replaced by TemplateView(template='template') or a subclass of that.  
    #TODO: Should use login_required?
    logger.info('Template requested: {0}.html'.format(resource))
    templateUrl = 'data/{0}.html'.format(resource)
    return render_to_response(templateUrl) 
