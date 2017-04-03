from django.conf.urls import patterns, include, url
from django.core.urlresolvers import reverse

urlpatterns = patterns(
    'designsafe.apps.rapid.views',
    url(r'^.*$', 'index', name='index'),
    
)
