from django.conf.urls import url, include
from designsafe.apps.api.licenses.views import MATLABLicenseView, LSDYNALicenseView

urlpatterns = [
    url(r'^matlablicense/(?P<username>[a-zA-Z0-9\-_\.]+)/$', MATLABLicenseView.as_view(), name='MATLABLicense'),
    url(r'^lsdynalicense/(?P<username>[a-zA-Z0-9\-_\.]+)/$', LSDYNALicenseView.as_view(), name='LSDYNALicense')
]
