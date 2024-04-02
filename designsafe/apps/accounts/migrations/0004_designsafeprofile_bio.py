# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('designsafe_accounts', '0003_auto_20160907_1419'),
    ]

    operations = [
        migrations.AddField(
            model_name='designsafeprofile',
            name='bio',
            field=models.CharField(default=None, max_length=4096),
        ),
    ]
