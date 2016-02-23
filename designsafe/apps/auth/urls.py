from django.conf.urls import patterns, include, url
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _

urlpatterns = patterns(
    'designsafe.apps.auth.views',
    url(r'^$', 'login_options', name='login'),
    url(r'^agave/$', 'agave_oauth', name='agave_oauth'),
    url(r'^agave/callback/$', 'agave_oauth_callback', name='agave_oauth_callback'),
    url(r'^agave/session-error/$', 'agave_session_error', name='agave_session_error'),
)


def menu_items(**kwargs):
    if 'type' in kwargs and kwargs['type'] == 'account':
        return [
            {
                'label': _('Login'),
                'url': reverse('login'),
                'children': [],
                'visible': False
            },
            {
                'label': _('Login'),
                'url': reverse('designsafe_auth:login'),
                'children': [],
                'visible': False
            },
            {
                'label': _('Agave'),
                'url': reverse('designsafe_auth:agave_session_error'),
                'children': [],
                'visible': False
            }
        ]
