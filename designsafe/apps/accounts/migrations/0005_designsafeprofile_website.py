# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('designsafe_accounts', '0004_designsafeprofile_bio'),
    ]

    operations = [
        migrations.AddField(
            model_name='designsafeprofile',
            name='website',
            field=models.CharField(default=None, max_length=256),
        ),
    ]
