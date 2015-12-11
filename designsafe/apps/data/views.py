from django.shortcuts import render, render_to_response
from django.http import HttpResponse
from dsapi.agave.files import *
from designsafe.apps.data.apps import DataEvent
import json
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

def list_path(request):
    """
      Returns a list of files/diretories under a specific path.
    """
    #TODO: should use @login_required.
    #TODO: should use @is_ajax.
    #TODO: get token from session.
    token = request.GET.get('token')
    #TODO: get url from settings.
    url = 'https://api.araport.org/'
    path = request.GET.get('path')

    af = AgaveFiles(url, token)
    l = af.list_path(path)
    
    DataEvent.send_event(event_data = {'path': path, 'callback': 'getList'})

    return HttpResponse(json.dumps(l), content_type="application/json")
