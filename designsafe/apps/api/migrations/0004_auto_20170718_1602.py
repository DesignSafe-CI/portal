# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_auto_20160712_1626'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='user',
            field=models.CharField(max_length=20, db_index=True),
        ),
    ]
