# Generated by Django 4.2.11 on 2024-07-16 19:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workspace', '0015_alter_apptraycategory_priority'),
    ]

    operations = [
        migrations.AddField(
            model_name='appvariant',
            name='user_guide_link',
            field=models.CharField(blank=True, help_text="Link to the app's user guide."),
        ),
    ]
