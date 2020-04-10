# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dropbox_integration', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='dropboxusertoken',
            old_name='refresh_token',
            new_name='account_id',
        ),
    ]
