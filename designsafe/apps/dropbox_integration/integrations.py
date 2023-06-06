from django.core.urlresolvers import reverse


def provide_integrations():
    return [
        {
            'label': 'Dropbox.com',
            'href': reverse('dropbox_integration:index'),
            'description': 'Access files from your Dropbox.com account in DesignSafe.',
        },
    ]
