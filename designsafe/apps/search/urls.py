from django.conf.urls import patterns, include, url
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _

urlpatterns = patterns(
    'designsafe.apps.search.views',
    url(r'^$', 'index', name='index'),
)
