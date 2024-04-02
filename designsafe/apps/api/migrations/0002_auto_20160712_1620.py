# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="broadcast",
            old_name="body",
            new_name="extra",
        ),
        migrations.RenameField(
            model_name="notification",
            old_name="body",
            new_name="extra",
        ),
        migrations.AddField(
            model_name="broadcast",
            name="message",
            field=models.TextField(default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="broadcast",
            name="operation",
            field=models.CharField(default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="broadcast",
            name="status",
            field=models.CharField(default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="notification",
            name="message",
            field=models.TextField(default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="notification",
            name="operation",
            field=models.CharField(default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="notification",
            name="status",
            field=models.CharField(default="", max_length=255),
            preserve_default=False,
        ),
    ]
