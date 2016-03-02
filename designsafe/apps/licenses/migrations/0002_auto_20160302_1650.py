# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('designsafe_licenses', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='matlablicense',
            name='license_type',
            field=models.CharField(max_length=255, choices=[(b'MATLAB', b'MATLAB')]),
        ),
    ]
