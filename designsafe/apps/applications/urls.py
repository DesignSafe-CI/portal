from django.conf.urls import include, url, patterns
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _


urlpatterns = patterns(
    'designsafe.apps.applications.views',
    url(r'^$', 'index', name='index'),
    url(r'^api/(?P<service>[a-z]+?)/$', 'call_api', name='call_api'),
)
