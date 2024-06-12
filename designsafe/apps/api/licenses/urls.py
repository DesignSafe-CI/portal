from django.urls import re_path as url
from designsafe.apps.api.licenses.views import LicenseView

urlpatterns = [
    url(r'^(?P<app_name>[a-zA-Z]+)/$', LicenseView.as_view(), name='License')
]
