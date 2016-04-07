# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('box_integration', '0002_boxusertoken_box_user_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='BoxUserStreamPosition',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('box_user_id', models.CharField(max_length=48)),
                ('stream_position', models.CharField(default=b'now', max_length=48)),
                ('user', models.OneToOneField(related_name='box_stream_pos', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterField(
            model_name='boxusertoken',
            name='user',
            field=models.OneToOneField(related_name='box_user_token', to=settings.AUTH_USER_MODEL),
        ),
    ]
