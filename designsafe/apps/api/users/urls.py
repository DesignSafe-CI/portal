from django.conf.urls import patterns, url, include
from designsafe.apps.api.users.views import SearchView

urlpatterns = patterns(
    'designsafe.apps.api.users.views',
    url(r'^$', SearchView.as_view(), name='search'),
)
