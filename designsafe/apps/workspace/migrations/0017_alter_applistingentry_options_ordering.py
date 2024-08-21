# Generated by Django 4.2.11 on 2024-08-16 16:34

from django.db import migrations, models
import django.db.models.functions.text


class Migration(migrations.Migration):
    dependencies = [
        ("workspace", "0016_applistingentry_user_guide_link"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="applistingentry",
            options={
                "ordering": [
                    "-is_popular",
                    "-is_simcenter",
                    django.db.models.functions.text.Lower("label"),
                ],
                "verbose_name_plural": "App Listing Entries",
            },
        ),
    ]
