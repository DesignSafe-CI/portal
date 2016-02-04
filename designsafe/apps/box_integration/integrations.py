from django.core.urlresolvers import reverse


def provide_integrations():
    return [
        {
            'label': 'Box.com',
            'href': reverse('box_integration:index'),
            'description': 'Sync files from your Box.com account to DesignSafe.',
        },
        # {
        #     'label': 'Dropbox',
        #     'href': None,
        #     'description': '',
        # },
        # {
        #     'label': 'Google Drive',
        #     'href': None,
        #     'description': '',
        # },
        # {
        #     'label': 'Amazon S3',
        #     'href': None,
        #     'description': '',
        # },
    ]
