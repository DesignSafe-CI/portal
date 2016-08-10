import os

DJANGO_RT = {
    'RT_HOST': os.environ.get('RT_HOST', 'https://rt.example.com/REST/1.0'),
    'RT_UN': os.environ.get('RT_USERNAME', 'username'),
    'RT_PW': os.environ.get('RT_PASSWORD', 'password'),
    'RT_QUEUE': os.environ.get('RT_DEFAULT_QUEUE', 'Support'),
}

TICKET_CATEGORIES = (
    ('DATA_DEPOT', 'Data Depot'),
    ('DISCOVERY_WORKSPACE', 'Discovery Workspace'),
    ('ECSS', 'ECSS'),
    ('LOGIN', 'Login/Registration'),
    ('OTHER', 'Other'),
)
