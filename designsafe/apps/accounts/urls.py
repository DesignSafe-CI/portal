from django.conf.urls import patterns, include, url
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _

urlpatterns = patterns(
    'designsafe.apps.accounts.views',
    url(r'^$', 'index', name='index'),
    url(r'^profile/$', 'manage_profile', name='manage_profile'),
    url(r'^profile/edit/$', 'profile_edit', name='profile_edit'),
    url(r'^authentication/$', 'manage_authentication', name='manage_authentication'),
    url(r'^identities/$', 'manage_identities', name='manage_identities'),
    url(r'^licenses/$', 'manage_licenses', name='manage_licenses'),
    url(r'^applications/$', 'manage_applications', name='manage_applications'),
    url(r'^notifications/settings/$', 'manage_notifications', name='manage_notifications'),
    url(r'^register/$', 'register', name='register'),
    url(r'^nees-account/(?:(?P<step>\d+)/)?$', 'nees_migration', name='nees_migration'),
    url(r'^registration-successful/$', 'registration_successful', name='registration_successful'),
    url(r'^password-reset/(?:(?P<code>.+)/)?$', 'password_reset', name='password_reset'),
    url(r'^activate/(?:(?P<code>.+)/)?$', 'email_confirmation', name='email_confirmation'),
    url(r'^departments\.json$', 'departments_json', name='departments_json'),

    url(r'^mailing-list/(?P<list_name>.*)/$', 'mailing_list_subscription',
        name='mailing_list_subscription'),
)


def menu_items(**kwargs):
    if 'type' in kwargs and kwargs['type'] == 'account':
        return [
            {
                'label': _('Manage Account'),
                'url': reverse('designsafe_accounts:index'),
                'children': [],
            },
        ]
