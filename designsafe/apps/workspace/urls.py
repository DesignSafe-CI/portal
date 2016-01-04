
from django.conf.urls import include, url, patterns
from django.views.generic.base import TemplateView

urlpatterns = patterns('designsafe.apps.workspace.views',
    url(r'^$', 'index', name='index'),
    url(r'^templates/(?P<resource>.+?)\.html$', 'get_template', name='ws_get_template'),
)