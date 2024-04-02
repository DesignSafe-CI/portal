from django.urls import include, re_path as url
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from designsafe.apps.notifications import views


urlpatterns = [
    url(r"^$", views.index, name="index"),
    url(r"^notifications/$", views.notifications, name="notifications"),
    # url(r'^apps-list/$', 'apps_list', name='apps_list'),
    # url(r'^files-list/$', 'files_list', name='files_list'),
    # url(r'^jobs-list/$', 'jobs_list', name='jobs_list'),
    # url(r'^jobs-details/$', 'jobs_details', name='jobs_details'),
]


def menu_items(**kwargs):
    if "type" in kwargs and kwargs["type"] == "account":
        return [
            {
                "label": _("Notifications"),
                "url": reverse("designsafe_notifications:index"),
                "children": [],
            }
        ]
