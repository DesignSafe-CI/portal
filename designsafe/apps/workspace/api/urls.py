"""Workpace API Urls"""

from django.urls import path, re_path
from designsafe.apps.workspace.api import views


app_name = "workspace_api"
urlpatterns = [
    path("apps/", views.AppsView.as_view()),
    path("tray/", views.AppsTrayView.as_view()),
    path("description", views.AppDescriptionView.as_view()),
    path("systems", views.SystemListingView.as_view()),
    path("systems/<str:system_id>", views.SystemDefinitionView.as_view()),
    re_path(
        r"^jobs/(?P<job_uuid>[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}\-[0-9a-fA-F]{3})/history/?$",
        views.JobHistoryView.as_view(),
    ),
    re_path(r"^jobs/(?P<operation>\w+)/?$", views.JobsView.as_view()),
    path("jobs", views.JobsView.as_view()),
    path("allocations", views.AllocationsView.as_view()),
    path(
        "user-favorites/", views.UserFavoriteList.as_view(), name="user_favorite_list"
    ),
    path(
        "user-favorites/add/", views.AddFavoriteTool.as_view(), name="add_favorite_tool"
    ),
    path(
        "user-favorites/remove/",
        views.RemoveFavoriteTool.as_view(),
        name="remove_favorite_tool",
    ),
]
