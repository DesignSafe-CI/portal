# Generated by Django 4.2.11 on 2024-05-31 21:08

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("workspace", "0013_userallocations"),
    ]

    operations = [
        migrations.AddField(
            model_name="appvariant",
            name="shortLabel",
            field=models.CharField(
                blank=True,
                help_text="The display name of this app in the Apps side navigation. If not defined, uses notes.shortLabel from app definition.",
                max_length=64,
            ),
        ),
    ]
