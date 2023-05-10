from django.conf.urls import url
from designsafe.apps.nco.views import NcoIndexView, NcoTtcGrantsView

urlpatterns = [
    url(r'scheduler', NcoIndexView.as_view(
        template_name='designsafe/apps/nco/nco_index.html'
    ), name='scheduler'),

    url(r'ttc_grants', NcoTtcGrantsView.as_view(
        template_name='designsafe/apps/nco/ttc_grants.html'
    ), name='ttc_grants'),
]
