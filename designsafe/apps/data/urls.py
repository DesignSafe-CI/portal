from designsafe.apps.data.views.api import *
from designsafe.apps.data.views.base import BaseTemplate
from django.conf.urls import url, patterns
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _

urlpatterns = patterns('designsafe.apps.data.views.base',
    url(r'^$', BaseTemplate.as_view(template_name='data/index.html'), name='index'),
    url(r'^my/$', BaseTemplate.as_view(template_name='data/my_data.html'), name='my_data'),
    url(r'^public/$', BaseTemplate.as_view(template_name='data/public_data.html'), name='public_data'),
)

urlpatterns += patterns('designsafe.apps.data.views.api',
    url(r'^api/listings/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ListingsView.as_view(), name='listings'),
    url(r'^api/download/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', DownloadView.as_view(), name='download'),
    url(r'^api/upload/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', UploadView.as_view(), name='upload'),
    url(r'^api/meta/?$', MetaSearchView.as_view(), name='meta_search'),
    url(r'^api/meta/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', MetadataView.as_view(), name='metadata'),
    url(r'^api/rename/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ManageView.as_view(), name='manage'),
    url(r'^api/move/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ManageView.as_view(), name='manage'),
    url(r'^api/copy/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ManageView.as_view(), name='manage'),
    url(r'^api/delete/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ManageView.as_view(), name='manage'),
    url(r'^api/mkdir/(?P<file_path>[a-zA-Z\-\_\.0-9\/]+)?$', ManageView.as_view(), name='manage'),
)


def menu_items(**kwargs):
    if 'type' in kwargs and kwargs['type'] == 'research_workbench':
        return [
            {
                'label': _('Data Browser'),
                'url': reverse('designsafe_data:index'),
                'children': [
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
            }
        ]
