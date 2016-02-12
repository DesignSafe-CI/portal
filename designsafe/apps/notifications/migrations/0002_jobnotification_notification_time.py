# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import datetime


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobnotification',
            name='notification_time',
            field=models.DateTimeField(default=datetime.datetime.now, blank=True),
        ),
    ]
