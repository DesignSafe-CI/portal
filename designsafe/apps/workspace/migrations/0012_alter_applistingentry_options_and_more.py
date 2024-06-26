# Generated by Django 4.2.11 on 2024-04-29 19:23

from django.db import migrations
import django.db.models.functions.comparison
import django.db.models.functions.text


class Migration(migrations.Migration):
    dependencies = [
        ("workspace", "0011_alter_applistingentry_options"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="applistingentry",
            options={
                "ordering": [
                    "-is_popular",
                    django.db.models.functions.text.Lower("label"),
                ],
                "verbose_name_plural": "App Listing Entries",
            },
        ),
        migrations.AlterModelOptions(
            name="appvariant",
            options={
                "ordering": [
                    "priority",
                    django.db.models.functions.text.Lower(
                        django.db.models.functions.comparison.Coalesce(
                            "label", "app_id"
                        )
                    ),
                ]
            },
        ),
    ]
