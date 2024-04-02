from django.urls import path, re_path as url
from designsafe.apps.api.users.views import SearchView, AuthenticatedView, UsageView, ProjectUserView, PublicView

urlpatterns = [
    path("project-lookup/", ProjectUserView.as_view()),
    url(r'^$', SearchView.as_view(), name='user_search'),
    url(r'^auth/$', AuthenticatedView.as_view(), name='user_authenticated'),
    url(r'^usage/$', UsageView.as_view(), name='user_usage'),
    url(r'^public/$', PublicView.as_view(), name='user_public')
]
