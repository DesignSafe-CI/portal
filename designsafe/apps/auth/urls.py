from django.conf.urls import patterns, include, url

urlpatterns = patterns('designsafe.apps.auth.views',
    url(r'^$', 'login_options', name='login'),
    url(r'^agave/$', 'agave_oauth', name='agave_oauth'),
    url(r'^agave/callback/$', 'agave_oauth_callback', name='agave_oauth_callback'),
)