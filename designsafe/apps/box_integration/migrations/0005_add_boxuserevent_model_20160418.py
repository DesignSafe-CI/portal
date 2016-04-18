# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('box_integration', '0004_boxuserstreamposition_last_event_processed'),
    ]

    operations = [
        migrations.CreateModel(
            name='BoxUserEvent',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('event_id', models.CharField(max_length=48)),
                ('event_type', models.CharField(max_length=48)),
                ('created_at', models.DateTimeField()),
                ('source', models.TextField()),
                ('from_stream_position', models.CharField(max_length=48)),
                ('processed', models.BooleanField(default=False)),
                ('processed_at', models.DateTimeField(null=True, blank=True)),
                ('retry', models.BooleanField(default=False)),
                ('user', models.ForeignKey(related_name='box_events', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='boxuserevent',
            unique_together=set([('event_id', 'user')]),
        ),
    ]
