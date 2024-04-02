from django.urls import reverse


def provide_integrations():
    return [
        {
            'label': 'Box.com',
            'href': reverse('box_integration:index'),
            'description': 'Access files from your Box.com account in DesignSafe.',
        },
    ]
