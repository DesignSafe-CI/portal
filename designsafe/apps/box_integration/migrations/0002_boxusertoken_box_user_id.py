# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('box_integration', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='boxusertoken',
            name='box_user_id',
            field=models.CharField(default='0', max_length=48),
            preserve_default=False,
        ),
    ]
