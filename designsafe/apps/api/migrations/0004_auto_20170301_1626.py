# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


def add_ds_user_profile(app, schema_editor):
    from designsafe.apps.api.users.models import DesignsafeUser
    DesignsafeUser.init()

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_auto_20160712_1626'),
    ]

    operations = [
        migrations.RunPython(add_ds_user_profile),
    ]
