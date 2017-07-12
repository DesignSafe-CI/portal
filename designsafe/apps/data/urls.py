from django.conf.urls import url, patterns
from designsafe.apps.data.views.base import DataDepotView
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _

urlpatterns = patterns(
    'designsafe.apps.data.views.base',
    url(r'^browser/', DataDepotView.as_view(template_name='data/data_depot.html'),
        name='data_depot')

)

def menu_items(**kwargs):
    if 'type' in kwargs and kwargs['type'] == 'research_workbench':
        return [
            {
                'label': _('Public Data'),
                'url': reverse('designsafe_data:public_data'),
                'children': []
            },
            {
                'label': _('My Data'),
                'url': reverse('designsafe_data:my_data'),
                'children': []
            }
        ]
