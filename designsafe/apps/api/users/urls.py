from django.conf.urls import url
from designsafe.apps.api.users.views import SearchView, AuthenticatedView

urlpatterns = [
    url(r'^$', SearchView.as_view(), name='user_search'),
    url(r'^auth/$', AuthenticatedView.as_view(), name='user_authenticated'),
]
