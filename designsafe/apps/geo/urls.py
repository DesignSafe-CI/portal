from django.urls import include, re_path as url
from django.urls import reverse
from designsafe.apps.geo import views

urlpatterns = [
    url(r"^$", views.index, name="index"),
    url(r"^test/$", views.test, name="test"),
    url(r"^.*$", views.index, name="index"),
]
