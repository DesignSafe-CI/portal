# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("designsafe_accounts", "0002_notificationpreferences"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="notificationpreferences",
            options={
                "permissions": (
                    (
                        "view_notification_subscribers",
                        "Can view list of users subscribed to a notification type",
                    ),
                )
            },
        ),
        migrations.AlterField(
            model_name="notificationpreferences",
            name="announcements",
            field=models.BooleanField(
                default=True,
                verbose_name="Receive occasional announcements from DesignSafe",
            ),
        ),
    ]
