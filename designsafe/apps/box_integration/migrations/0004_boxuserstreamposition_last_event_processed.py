# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('box_integration', '0003_auto_20160328_2215'),
    ]

    operations = [
        migrations.AddField(
            model_name='boxuserstreamposition',
            name='last_event_processed',
            field=models.CharField(max_length=48, blank=True),
        ),
    ]
