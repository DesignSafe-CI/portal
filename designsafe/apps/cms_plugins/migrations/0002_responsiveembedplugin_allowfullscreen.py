# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cms_plugins", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="responsiveembedplugin",
            name="allowfullscreen",
            field=models.BooleanField(default=True, verbose_name=b"Allow Fullscreen"),
        ),
    ]
