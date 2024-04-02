# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("designsafe_accounts", "0008_auto_20161118_2025"),
    ]

    operations = [
        migrations.CreateModel(
            name="DesignSafeProfileResearchActivities",
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
                ("description", models.CharField(max_length=300)),
            ],
        ),
        migrations.AddField(
            model_name="designsafeprofile",
            name="professional_level",
            field=models.CharField(default=None, max_length=256, null=True),
        ),
    ]
