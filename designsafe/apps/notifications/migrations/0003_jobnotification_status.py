# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0002_jobnotification_notification_time'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobnotification',
            name='status',
            field=models.CharField(default='JOB_CREATED', max_length=50),
            preserve_default=False,
        ),
    ]
