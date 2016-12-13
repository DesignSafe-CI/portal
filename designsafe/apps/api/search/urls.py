from django.conf.urls import patterns, url, include
from designsafe.apps.api.search.views import SearchView

"""
"""
urlpatterns = patterns(
    'designsafe.apps.api.search.views',
    url(r'^/?$', SearchView.as_view(), name='search'),
)
