"""Model for published works."""

from django.utils import timezone
from django.db import models
from django.core.serializers.json import DjangoJSONEncoder


class Publication(models.Model):
    """
    Model for published works. `value` attribute contains the publication tree
    serialized using the NetworkX node_link_data method.
    """

    project_id = models.CharField(max_length=100, primary_key=True, editable=False)
    created = models.DateTimeField(default=timezone.now)
    is_published = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)
    value = models.JSONField(
        encoder=DjangoJSONEncoder,
        help_text=(
            "Value for the project's base metadata, including title/description/users"
        ),
    )

    tree = models.JSONField(
        encoder=DjangoJSONEncoder,
        help_text=("JSON document containing the serialized publication tree"),
    )
