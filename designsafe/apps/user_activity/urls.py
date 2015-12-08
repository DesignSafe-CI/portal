from django.conf.urls import include, url, patterns

urlpatterns = patterns('designsafe.apps.user_activity.views',
    url(r'^template/(?P<resource>.+?)\.html/$', 'get_template', name='data-get_template'),
)
