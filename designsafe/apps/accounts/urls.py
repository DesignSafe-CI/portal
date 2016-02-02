from django.conf.urls import patterns, include, url

urlpatterns = patterns(
    'designsafe.apps.accounts.views',
    url(r'^$', 'index', name='index'),
    url(r'^profile/$', 'manage_profile', name='manage_profile'),
    url(r'^authentication/$', 'manage_authentication', name='manage_authentication'),
    url(r'^identities/$', 'manage_identities', name='manage_identities'),
    url(r'^applications/$', 'manage_applications', name='manage_applications'),
    url(r'^notifications/$', 'notifications', name='notifications'),
    url(r'^notifications/settings/$', 'manage_notifications', name='manage_notifications'),
    url(r'^register/$', 'register', name='register'),
    url(r'^departments\.json$', 'departments_json', name='departments_json'),
)
