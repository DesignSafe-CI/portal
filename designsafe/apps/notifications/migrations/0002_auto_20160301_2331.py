# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import datetime


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                (
                    "id",
                    models.AutoField(
                        verbose_name="ID",
                        serialize=False,
                        auto_created=True,
                        primary_key=True,
                    ),
                ),
                ("event_type", models.CharField(max_length=50)),
                ("user", models.CharField(max_length=20)),
                ("read", models.BooleanField(default=False)),
                ("deleted", models.BooleanField(default=False)),
                (
                    "notification_time",
                    models.DateTimeField(default=datetime.datetime.now, blank=True),
                ),
                ("body", models.TextField()),
            ],
        ),
        migrations.DeleteModel(
            name="JobNotification",
        ),
    ]
