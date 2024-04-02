from django.urls import include, re_path as url
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from designsafe.apps.dashboard import views

urlpatterns = [
    url(r"^$", views.index, name="index"),
]
