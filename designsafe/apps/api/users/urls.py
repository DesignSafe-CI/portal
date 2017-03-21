from django.conf.urls import url
from designsafe.apps.api.users.views import SearchView, AuthenticatedView, UsageView

urlpatterns = [
    url(r'^$', SearchView.as_view(), name='user_search'),
    url(r'^auth/$', AuthenticatedView.as_view(), name='user_authenticated'),
    url(r'^usage/$', UsageView.as_view(), name='user_usage')
]
