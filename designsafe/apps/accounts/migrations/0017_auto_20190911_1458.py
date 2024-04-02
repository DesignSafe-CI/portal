# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2019-09-11 14:58
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("designsafe_accounts", "0016_designsafeprofile_agree_to_account_limit"),
    ]

    operations = [
        migrations.AddField(
            model_name="designsafeprofile",
            name="last_updated",
            field=models.DateTimeField(auto_now=True, null=True),
        ),
        migrations.AddField(
            model_name="designsafeprofile",
            name="update_required",
            field=models.BooleanField(default=True),
        ),
    ]
