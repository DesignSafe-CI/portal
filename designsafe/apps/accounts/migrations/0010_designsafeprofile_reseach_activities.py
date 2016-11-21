# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('designsafe_accounts', '0009_auto_20161121_1633'),
    ]

    operations = [
        migrations.AddField(
            model_name='designsafeprofile',
            name='reseach_activities',
            field=models.ManyToManyField(to='designsafe_accounts.DesignSafeProfileResearchActivities'),
        ),
    ]
