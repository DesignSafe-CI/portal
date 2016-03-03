from designsafe.apps.data.views.api import *
from django.conf.urls import url, patterns
from designsafe.apps.data.views.base import BasePrivateTemplate, BasePublicTemplate
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _

urlpatterns = patterns(
    'designsafe.apps.data.views.base',
    url(r'^my/$', BasePrivateTemplate.as_view(template_name='data/my_data.html'),
        name='my_data'),
    url(r'^public/$', BasePublicTemplate.as_view(template_name='data/public_data.html'),
        name='public_data'),

)

urlpatterns += patterns('designsafe.apps.data.views.api',
    url(r'^api/default/listings/(?P<file_path>[ \S]+)?$', ListingsView.as_view(filesystem='default'), name='listings'),
    url(r'^api/default/download/(?P<file_path>[ \S]+)?$', DownloadView.as_view(filesystem='default'), name='download'),
    url(r'^api/default/upload/(?P<file_path>[ \S]+)?$', UploadView.as_view(filesystem='default'), name='upload'),
    url(r'^api/default/meta/?$', MetaSearchView.as_view(filesystem='default'), name='meta_search'),
    url(r'^api/default/meta/(?P<file_path>[ \S]+)?$', MetadataView.as_view(filesystem='default'), name='metadata'),
    url(r'^api/default/rename/(?P<file_path>[ \S]+)?$', ManageView.as_view(filesystem='default'), name='manage'),
    url(r'^api/default/move/(?P<file_path>[ \S]+)?$', ManageView.as_view(filesystem='default'), name='manage'),
    url(r'^api/default/copy/(?P<file_path>[ \S]+)?$', ManageView.as_view(filesystem='default'), name='manage'),
    url(r'^api/default/delete/(?P<file_path>[ \S]+)?$', ManageView.as_view(filesystem='default'), name='manage'),
    url(r'^api/default/mkdir/(?P<file_path>[ \S]+)?$', ManageView.as_view(filesystem='default'), name='manage'),
    url(r'^api/default/share/(?P<file_path>[ \S]+)?$', ShareView.as_view(filesystem='default'), name='manage'),
)

urlpatterns += patterns('designsafe.apps.data.views.api',
    url(r'^api/(?P<filesystem>[a-zA-Z\-\_\.0-9\/]+)/listings/(?P<file_path>[ \S]+)?$', PublicListingsView.as_view(), name='listings'),
    url(r'^api/(?P<filesystem>[a-zA-Z\-\_\.0-9\/]+)/download/(?P<file_path>[ \S]+)?$', PublicDownloadView.as_view(), name='download'),
    url(r'^api/(?P<filesystem>[a-zA-Z\-\_\.0-9\/]+)/meta/?$', PublicMetaSearchView.as_view(), name='meta_search'),
    url(r'^api/(?P<filesystem>[a-zA-Z\-\_\.0-9\/]+)/meta/(?P<file_path>[ \S]+)?$', PublicMetadataView.as_view(), name='metadata'),
)

def menu_items(**kwargs):
    if 'type' in kwargs and kwargs['type'] == 'research_workbench':
        return [
            {
                'label': _('Data Depot'),
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
