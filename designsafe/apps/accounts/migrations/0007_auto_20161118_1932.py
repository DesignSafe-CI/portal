# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('designsafe_accounts', '0006_auto_20161117_2237'),
    ]

    operations = [
        migrations.CreateModel(
            name='DesignSafeProfileNHInterests',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('description', models.CharField(max_length=300)),
            ],
        ),
        migrations.AddField(
            model_name='designsafeprofile',
            name='nh_interests',
            field=models.ManyToManyField(to='designsafe_accounts.DesignSafeProfileNHInterests'),
        ),
    ]
