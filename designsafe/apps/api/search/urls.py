"""api search urls."""
from django.urls import path
from designsafe.apps.api.search.views import SearchView


urlpatterns = [
    path('', SearchView.as_view(), name='search'),
]
