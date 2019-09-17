"""api search urls."""
from django.urls import path
from designsafe.apps.api.search.views import SearchView

app_name = "ds_search"
urlpatterns = [
    path('', SearchView.as_view(), name='search'),
]
