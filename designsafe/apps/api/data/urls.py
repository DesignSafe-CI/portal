from django.conf.urls import include, url, patterns

urlpatterns = patterns('designsafe.apps.api.data.views',
    url(r'^list-path/$', 'list_path', name='data-list_path'),
)
