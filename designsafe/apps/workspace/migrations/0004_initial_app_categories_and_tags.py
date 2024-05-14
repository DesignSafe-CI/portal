from django.db import migrations


APP_CATEGORIES = [
    ("5", "Simulation"),
    ("4", "Sim Center Tools"),
    ("3", "Visualization"),
    ("2", "Analysis"),
    ("1", "Hazard Apps"),
    ("0", "Utilities"),
]

NATURAL_HAZARD_TYPES = [
    "Drought",
    "Earthquake",
    "Extreme Temperatures",
    "Wildfire",
    "Flood",
    "Hurricane/Tropical Storm",
    "Landslide",
    "Tornado",
    "Tsunami",
    "Thunderstorm",
    "Storm Surge",
    "Pandemic",
    "Wind",
    "Fire",
    "Hurricane",
    "Tropical Storm",
]


def populate_categories(apps, schema_editor):
    AppTrayCategory = apps.get_model("workspace", "AppTrayCategory")
    for priority, category in APP_CATEGORIES:
        AppTrayCategory.objects.create(
            priority=priority,
            category=category,
        )


def reverse_populate_categories(apps, schema_editor):
    AppTrayCategory = apps.get_model("workspace", "AppTrayCategory")
    AppTrayCategory.objects.all().delete()


def populate_tags(apps, schema_editor):
    AppTag = apps.get_model("workspace", "AppTag")
    for type in NATURAL_HAZARD_TYPES:
        AppTag.objects.create(
            name=type,
        )


def reverse_populate_tags(apps, schema_editor):
    AppTag = apps.get_model("workspace", "AppTag")
    AppTag.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("workspace", "0003_applistingentry_apptraycategory_appvariant_and_more"),
    ]

    operations = [
        migrations.RunPython(populate_categories, reverse_populate_categories),
        migrations.RunPython(populate_tags, reverse_populate_tags),
    ]
