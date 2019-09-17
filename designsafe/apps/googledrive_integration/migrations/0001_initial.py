# Generated by Django 2.2.5 on 2019-09-17 19:25

import designsafe.apps.googledrive_integration.models
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='GoogleDriveUserToken',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('credential', designsafe.apps.googledrive_integration.models.CredentialsField(null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='googledrive_user_token', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
