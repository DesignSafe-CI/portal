from django.conf.urls import include, url
from django.urls import reverse
from django.utils.translation import ugettext_lazy as _
from designsafe.apps.auth import views

urlpatterns = [
    url(r'^$', views.login_options, name='login'),
    url(r'^logged-out/$', views.logged_out, name='logout'),
    url(r'^agave/$', views.agave_oauth, name='agave_oauth'),
    url(r'^agave/callback/$', views.agave_oauth_callback, name='agave_oauth_callback'),
    url(r'^agave/session-error/$', views.agave_session_error, name='agave_session_error'),
]


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
