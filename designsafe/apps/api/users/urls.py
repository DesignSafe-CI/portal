from django.urls import path
from django.urls import re_path as url

from designsafe.apps.api.users.views import (
    AuthenticatedView,
    ProjectUserView,
    PublicView,
    SearchView,
    UsageView,
)

urlpatterns = [
    path("project-lookup/", ProjectUserView.as_view()),
    url(r'^$', SearchView.as_view(), name='user_search'),
    url(r'^auth/$', AuthenticatedView.as_view(), name='user_authenticated'),
    url(r'^usage/$', UsageView.as_view(), name='user_usage'),
    url(r'^public/$', PublicView.as_view(), name='user_public')
]
