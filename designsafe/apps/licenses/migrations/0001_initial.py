# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MATLABLicense",
            fields=[
                (
                    "id",
                    models.AutoField(
                        verbose_name="ID",
                        serialize=False,
                        auto_created=True,
                        primary_key=True,
                    ),
                ),
                (
                    "license_type",
                    models.CharField(max_length=255, choices=[(b"MATLAB", b"Matlab")]),
                ),
                (
                    "license_file_content",
                    models.TextField(
                        help_text=b"This should be entire contents ofthe user's MATLAB license file. Please ensure you paste the license exactly as it is in the license file."
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        related_name="licenses",
                        to=settings.AUTH_USER_MODEL,
                        on_delete=models.CASCADE,
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
    ]
