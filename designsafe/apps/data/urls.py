from django.urls import re_path as url
from designsafe.apps.data.views.base import (
    DataDepotView,
    FileMediaView,
    DataDepotPublishedView,
    DataDepotLegacyPublishedView,
)
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

urlpatterns = [
    url(
        r"^browser/public/designsafe.storage.published/(?P<project_id>[A-Z\-]+-[0-9]+)(v(?P<revision>[0-9]+))?/(?P<file_path>[ \S]+)/?",
        DataDepotPublishedView.as_view(),
    ),
    url(
        r"^browser/public/designsafe.storage.published/(?P<project_id>[A-Z\-]+-[0-9]+)(v(?P<revision>[0-9]+))?/?",
        DataDepotPublishedView.as_view(),
    ),
    url(
        r"^browser/public/nees.public/(?P<project_id>[\w.\-]+)/(?P<file_path>[ \S]+)/?",
        DataDepotLegacyPublishedView.as_view(),
    ),
    url(
        r"^browser/public/nees.public/(?P<project_id>[\w.\-]+)/?",
        DataDepotLegacyPublishedView.as_view(),
    ),
    url(
        r"^browser/",
        DataDepotView.as_view(template_name="data/data_depot.html"),
        name="data_depot",
    ),
    url(
        r"^browser/files/media/(?P<file_mgr_name>[\w.-]+)/(?P<system_id>[\w.\-]+)/(?P<file_path>[ \S]+)$",
        FileMediaView.as_view(),
        name="files_media",
    ),
]


# Seems to be unused
def menu_items(**kwargs):
    if "type" in kwargs and kwargs["type"] == "research_workbench":
        return [
            {
                "label": _("Published"),
                "url": reverse("designsafe_data:public_data"),
                "children": [],
            },
            {
                "label": _("My Data"),
                "url": reverse("designsafe_data:my_data"),
                "children": [],
            },
            {
                "label": _("My Projects"),
                "url": reverse("designsafe_data:my_projects"),
                "children": [],
            },
        ]
