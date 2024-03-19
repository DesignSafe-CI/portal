from django.db import migrations


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


def populate_tags(apps, schema_editor):
    AppTag = apps.get_model("workspace", "AppTag")
    for type in NATURAL_HAZARD_TYPES:
        AppTag.objects.create(
            name=type,
        )


def reverse_func(apps, schema_editor):
    AppTag = apps.get_model("workspace", "AppTag")
    AppTag.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("workspace", "0005_apptag_rename_popular_applistingentry_is_popular_and_more"),
    ]

    operations = [
        migrations.RunPython(populate_tags, reverse_func),
    ]
