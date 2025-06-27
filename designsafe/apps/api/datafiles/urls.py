from django.urls import re_path as url, path
from designsafe.apps.api.datafiles.views import (
    DataFilesView,
    TransferFilesView,
    MicrosurveyView,
    UserFavoriteList,
    AddFavoriteTool,
    RemoveFavoriteTool,
)

urlpatterns = [
    url(r'^transfer/(?P<format>[\w.-]+)/$', TransferFilesView.as_view(), name='file_transfer'),

    # Browsing:
    url(r'^(?P<api>[\w.-]+)/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/(?P<path>[ \S]+)/$',
        DataFilesView.as_view(), name='agave_files'),

    url(r'^(?P<api>[\w.-]+)/(?P<scheme>[\w.-]+)/(?P<operation>[\w.-]+)/(?P<system>[\w.-]+)/$',
        DataFilesView.as_view(), name='agave_files'),

    url(r'^microsurvey/$', MicrosurveyView.as_view(), name='microsurvey'),

    # Favorites (added using modern path, compatible with url)
    path('favorites/', UserFavoriteList.as_view(), name='favorites-list'),
    path('favorites/add/', AddFavoriteTool.as_view(), name='add-favorite'),
    path('favorites/remove/', RemoveFavoriteTool.as_view(), name='remove-favorite'),
]
