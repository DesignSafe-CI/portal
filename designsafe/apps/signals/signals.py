from django.dispatch import Signal

ds_event = Signal(providing_args=['session_id', 'event_type', 'event_data'])

notify_event = Signal(providing_args=['event_type', 'event_data', 'event_users'])
