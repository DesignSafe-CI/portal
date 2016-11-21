# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('designsafe_accounts', '0011_auto_20161121_1643'),
    ]

    operations = [
        migrations.RenameField(
            model_name='designsafeprofile',
            old_name='reseach_activities',
            new_name='research_activities',
        ),
    ]
