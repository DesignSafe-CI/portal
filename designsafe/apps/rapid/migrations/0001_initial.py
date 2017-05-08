# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations
from designsafe.apps.rapid.models import RapidNHEventType, RapidNHEvent


def add_rapid_event_types(apps, schema_editor):
    RapidNHEvent.init()
    RapidNHEventType.init()
    events = [
        {"name": "earthquake", "display_name": "Earthquake"},
        {"name": "landslide", "display_name": "Landslide"},
        {"name": "tsunami", "display_name": "Tsunami"},
        {"name": "flood", "display_name": "Flood"},
        {"name": "hurricane", "display_name": "Hurricane/Typhoon"},
        {"name": "tornado", "display_name": "Tornado"}
    ]

    for ev in events:
        et = RapidNHEventType(**ev)
        et.save()

class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.RunPython(add_rapid_event_types)
    ]
