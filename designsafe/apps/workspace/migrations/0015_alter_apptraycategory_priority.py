# Generated by Django 4.2.11 on 2024-06-18 18:30

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("workspace", "0014_appvariant_short_label"),
    ]

    operations = [
        migrations.AlterField(
            model_name="apptraycategory",
            name="priority",
            field=models.IntegerField(
                default=0,
                help_text="Category priority, where lower number categories appear before higher ones.",
            ),
        ),
    ]
