# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("designsafe_accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="NotificationPreferences",
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
                (
                    "announcements",
                    models.BooleanField(
                        default=True,
                        help_text="Receive occasional announcements from DesignSafe",
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        related_name="notification_preferences",
                        to=settings.AUTH_USER_MODEL,
                        on_delete=models.CASCADE,
                    ),
                ),
            ],
        ),
    ]
