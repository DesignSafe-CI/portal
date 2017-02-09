from django.db import models

# Create your models here.
from designsafe.apps.api.agave.models.fields import (CharField, UuidField, DateTimeField,
                                                     IntField, DecimalField, ListField,
                                                     NestedObjectField, RelatedObjectField)
from designsafe.apps.api.projects.models import (ExperimentalProject, FileModel,
                                                 Experiment, ModelConfiguration)

from designsafe.apps.api.agave.models.base import set_lazy_rels
set_lazy_rels()
