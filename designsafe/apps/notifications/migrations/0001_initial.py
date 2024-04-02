# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="JobNotification",
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
                ("event", models.CharField(max_length=50)),
                ("user", models.CharField(max_length=20)),
                ("read", models.BooleanField(default=False)),
                ("deleted", models.BooleanField(default=False)),
                ("job_name", models.CharField(max_length=100)),
                ("job_id", models.CharField(max_length=40)),
            ],
            options={
                "abstract": False,
            },
        ),
    ]
