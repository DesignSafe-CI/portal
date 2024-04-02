# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("designsafe_accounts", "0012_auto_20161121_1711"),
    ]

    operations = [
        migrations.AddField(
            model_name="designsafeprofile",
            name="orcid_id",
            field=models.CharField(default=None, max_length=256, null=True, blank=True),
        ),
        migrations.AlterField(
            model_name="designsafeprofile",
            name="bio",
            field=models.CharField(
                default=None, max_length=4096, null=True, blank=True
            ),
        ),
        migrations.AlterField(
            model_name="designsafeprofile",
            name="website",
            field=models.CharField(default=None, max_length=256, null=True, blank=True),
        ),
    ]
