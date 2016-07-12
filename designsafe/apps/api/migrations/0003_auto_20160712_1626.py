# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_auto_20160712_1620'),
    ]

    operations = [
        migrations.AlterField(
            model_name='broadcast',
            name='extra',
            field=models.TextField(default=b''),
        ),
        migrations.AlterField(
            model_name='broadcast',
            name='message',
            field=models.TextField(default=b''),
        ),
        migrations.AlterField(
            model_name='broadcast',
            name='operation',
            field=models.CharField(default=b'', max_length=255),
        ),
        migrations.AlterField(
            model_name='notification',
            name='extra',
            field=models.TextField(default=b''),
        ),
        migrations.AlterField(
            model_name='notification',
            name='message',
            field=models.TextField(default=b''),
        ),
        migrations.AlterField(
            model_name='notification',
            name='operation',
            field=models.CharField(default=b'', max_length=255),
        ),
    ]
