from django.urls import re_path as url
from designsafe.apps.nco.views import NcoIndexView, NcoTtcGrantsView

urlpatterns = [
    url(
        r'scheduler',
        NcoIndexView.as_view(
            template_name="designsafe/apps/nco/nco_sched_index.html"
        ),
        name='scheduler'
    ),
    url(
        r'ttc_grants',
        NcoTtcGrantsView.as_view(
            template_name="designsafe/apps/nco/nco_grants_index.html"
        ),
        name='ttc_grants'
    ),
]
