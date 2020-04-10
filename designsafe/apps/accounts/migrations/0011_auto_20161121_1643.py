# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations

def add_research_activities_data(apps, schema_editor):
    DesignSafeProfileResearchActivities = apps.get_model("designsafe_accounts", "DesignSafeProfileResearchActivities")
    data = [
      "Already performed research in the NHERI program",
      "Performed research in the NEES program",
      "Performed research in the NHERI subject area but not in the NEES or NHERI programs",
      "Planning to perform research in the NHERI program",
      "Involved in education in the NHERI subject areas",
      "No direct involvement in reseach or education in the NHERI subject areas"
    ]
    for d in data:
        obj = DesignSafeProfileResearchActivities(description=d)
        obj.save()


class Migration(migrations.Migration):

    dependencies = [
        ('designsafe_accounts', '0010_designsafeprofile_reseach_activities'),
    ]

    operations = [
        migrations.RunPython(add_research_activities_data),
    ]
