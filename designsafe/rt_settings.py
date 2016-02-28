import os

DJANGO_RT = {
    'RT_HOST': os.environ.get('RT_HOST'),
    'RT_UN': os.environ.get('RT_USERNAME'),
    'RT_PW': os.environ.get('RT_PASSWORD'),
    'RT_QUEUE': os.environ.get('RT_DEFAULT_QUEUE'),
}

TICKET_CATEGORIES = (
    ('LOGIN', 'Login/Registration'),
    ('DATA_DEPOT', 'Data Depot'),
    ('DISCOVERY_WORKSPACE', 'Discovery Workspace'),
    ('OTHER', 'Other'),
)
