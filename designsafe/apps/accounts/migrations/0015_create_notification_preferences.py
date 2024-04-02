from django.db import migrations, models
from django.conf import settings
from django.apps import apps
from django.db.models import Q


def set_default_notification_prefs(apps, schema_editor):
    # Find users with no prefs set
    User = apps.get_model(settings.AUTH_USER_MODEL)
    NotificationPreferences = apps.get_model(
        "designsafe_accounts", "NotificationPreferences"
    )
    users = User.objects.filter(Q(notification_preferences__isnull=True))
    for user in users:
        prefs = NotificationPreferences(user=user)
        prefs.save()


class Migration(migrations.Migration):

    dependencies = [
        ("designsafe_accounts", "0014_auto_20170911_1503"),
    ]

    operations = [
        migrations.RunPython(set_default_notification_prefs),
    ]
