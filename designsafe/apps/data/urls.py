from django.conf.urls import include, url, patterns
from django.views.generic.base import TemplateView

urlpatterns = patterns('designsafe.apps.data.views',
    url(r'^$', TemplateView.as_view(template_name='data/index.html')),
    url(r'^template/(?P<resource>.+?)\.html/$', 'get_template', name='data-get_template'),
)
