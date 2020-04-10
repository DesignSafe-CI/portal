# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations
from django.contrib.auth.models import Group


def add_group(apps, scema_editor):
    group, created = Group.objects.get_or_create(name='Rapid Admin')

class Migration(migrations.Migration):

    dependencies = [
        ('rapid', '0002_auto_20170627_2004'),
    ]

    operations = [
        migrations.RunPython(add_group)
    ]
