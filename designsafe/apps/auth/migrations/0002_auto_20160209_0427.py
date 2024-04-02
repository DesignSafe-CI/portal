# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("designsafe_auth", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="agaveoauthtoken",
            name="scope",
            field=models.CharField(default="default", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="agaveoauthtoken",
            name="token_type",
            field=models.CharField(default="bearer", max_length=255),
            preserve_default=False,
        ),
    ]
