# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


def insert_data(apps, schema_editor):
    # We can't import the Person model directly as it may be a newer
    # version than this migration expects. We use the historical version.
    DesignSafeProfileNHInterests = apps.get_model("designsafe_accounts", "DesignSafeProfileNHInterests")
    data = [
      "Coastal engineering",
      "Earthquake",
      "Geotechnical",
      "Lifeline infrastructure",
      "Social sciences and/or policy",
      "Tsunami",
      "Wind"
    ]
    for d in data:
        obj = DesignSafeProfileNHInterests(description=d)
        obj.save()


class Migration(migrations.Migration):

    dependencies = [
        ('designsafe_accounts', '0007_auto_20161118_1932'),
    ]

    operations = [
      migrations.RunPython(insert_data),
    ]
