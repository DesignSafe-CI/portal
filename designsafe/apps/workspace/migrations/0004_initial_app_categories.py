from django.db import migrations


APP_CATEGORIES = [
    ("5", "Simulation"),
    ("4", "Sim Center Tools"),
    ("3", "Visualization"),
    ("2", "Analysis"),
    ("1", "Hazard Apps"),
    ("0", "Utilities"),
]


def populate_categories(apps, schema_editor):
    AppTrayCategory = apps.get_model("workspace", "AppTrayCategory")
    for priority, category in APP_CATEGORIES:
        AppTrayCategory.objects.create(
            priority=priority,
            category=category,
        )


def reverse_func(apps, schema_editor):
    AppTrayCategory = apps.get_model("workspace", "AppTrayCategory")
    AppTrayCategory.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("workspace", "0003_applistingentry_apptraycategory_appvariant_and_more"),
    ]

    operations = [
        migrations.RunPython(populate_categories, reverse_func),
    ]
