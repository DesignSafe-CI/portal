from django.conf.urls import url
from designsafe.apps.nco.views import NcoIndexView

urlpatterns = [
    url(r'', NcoIndexView.as_view(
        template_name='designsafe/apps/nco/nco_index.html'
    ), name='index')
]
