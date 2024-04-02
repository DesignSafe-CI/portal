# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import datetime


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Broadcast',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('event_type', models.CharField(max_length=50)),
                ('datetime', models.DateTimeField(default=datetime.datetime.now, blank=True)),
                ('body', models.TextField()),
                ('group', models.CharField(max_length=20)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('event_type', models.CharField(max_length=50)),
                ('datetime', models.DateTimeField(default=datetime.datetime.now, blank=True)),
                ('body', models.TextField()),
                ('user', models.CharField(max_length=20)),
                ('read', models.BooleanField(default=False)),
                ('deleted', models.BooleanField(default=False)),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
