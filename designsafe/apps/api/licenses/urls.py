from django.conf.urls import url, include
from designsafe.apps.api.licenses.views import LicenseView

urlpatterns = [
    url(r'^(?P<app_name>[a-zA-Z]+)/(?P<username>[a-zA-Z0-9\-_\.]+)/$', LicenseView.as_view(), name='License')
]
