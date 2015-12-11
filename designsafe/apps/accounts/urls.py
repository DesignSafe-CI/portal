from django.conf.urls import patterns, include, url

urlpatterns = patterns('designsafe.apps.accounts.views',
    url(r'^$', 'index', name='index'),
    url(r'^login/$', 'login', name='login'),
)