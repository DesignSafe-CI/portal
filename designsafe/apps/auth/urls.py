"""
.. module:: portal.apps.auth.urls
   :synopsis: Auth URLs
"""

from django.urls import path
from designsafe.apps.auth import views

app_name = "designsafe_auth"
urlpatterns = [
    path('login/', views.tapis_oauth, name="login"),
    path("logged-out/", views.logged_out, name="logout"),
    path("tapis/", views.tapis_oauth, name="tapis_oauth"),
    path("tapis/callback/", views.tapis_oauth_callback, name="tapis_oauth_callback"),
]


# from django.urls import reverse
# from django.utils.translation import gettext_lazy as _

# def menu_items(**kwargs):
#     if 'type' in kwargs and kwargs['type'] == 'account':
#         return [
#             {
#                 'label': _('Login'),
#                 'url': reverse('login'),
#                 'children': [],
#                 'visible': False
#             },
#             {
#                 'label': _('Login'),
#                 'url': reverse('designsafe_auth:login'),
#                 'children': [],
#                 'visible': False
#             },
#             {
#                 'label': _('Agave'),
#                 'url': reverse('designsafe_auth:agave_session_error'),
#                 'children': [],
#                 'visible': False
#             }
#         ]
