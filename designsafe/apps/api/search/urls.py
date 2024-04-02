from django.urls import re_path as url
from designsafe.apps.api.search.views import SearchView

"""
"""
urlpatterns = [
    url("", SearchView.as_view(), name="search"),
]
