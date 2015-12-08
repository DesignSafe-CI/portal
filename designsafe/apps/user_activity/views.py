from django.shortcuts import render, render_to_response
import logging
logger = logging.getLogger(__name__)
# Create your views here.
def get_template(request, resource):
   logger.info('Template requested: {0}.html'.format(resource))
   templateUrl = 'user_activity/{0}.html'.format(resource)
   return render_to_response(templateUrl) 
