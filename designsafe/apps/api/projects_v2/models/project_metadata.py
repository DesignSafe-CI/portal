"""Models for representing project metadata"""
import uuid
from django.utils import timezone
from django.db import models
from django.core.validators import MinLengthValidator
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.auth import get_user_model
from django.conf import settings
from django.dispatch import receiver
from designsafe.apps.api.projects_v2 import constants

user_model = get_user_model()


def uuid_pk():
    """Generate a string UUID for use as a primary key."""
    return str(uuid.uuid4())


class ProjectMetadata(models.Model):
    """This model represents project metadata. Each entity has a foreign-key relation
    to the base project metadata (the base project relates to itself).

    Some useful operations:
    - list all projects for a user:
      `<user>.projects.filter(name="designsafe.project")`
    - Get all entities with a given project ID:
      `ProjectMetadata.objects.filter(base_project__value__projectId="PRJ-1234")`

    """

    uuid = models.CharField(
        max_length=100, primary_key=True, default=uuid_pk, editable=False
    )
    name = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(1)],
        help_text="Metadata namespace, e.g. 'designsafe.project'",
    )
    value = models.JSONField(
        encoder=DjangoJSONEncoder,
        help_text=(
            "JSON document containing file metadata, including title/description"
        ),
    )

    users = models.ManyToManyField(
        to=user_model,
        related_name="projects",
        help_text="Users who have access to a project.",
    )
    base_project = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        help_text=(
            "Base project containing this entity."
            "For top-level project metadata, this is `self`."
        ),
    )
    created = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)

    association_ids = models.JSONField(
        default=list,
        help_text="(DEPRECATE IN V3) Tapis V2 association IDs.",
    )

    @property
    def project_id(self) -> str:
        """Convenience method for retrieving project IDs."""
        return self.base_project.value.get("projectId")

    @property
    def project_graph(self):
        """Convenience method for returning the project graph metadata"""
        return self.__class__.objects.get(
            name=constants.PROJECT_GRAPH, base_project=self.base_project
        )

    @classmethod
    def get_project_by_id(cls, project_id: str):
        """Return base project metadata matching a project ID value."""
        return cls.objects.get(name=constants.PROJECT, value__projectId=project_id)

    @classmethod
    def get_entities_by_project_id(cls, project_id: str):
        """Return an iterable of all metadata objects for a given project ID."""
        return cls.objects.filter(base_project__value__projectId=project_id)

    def to_dict(self):
        """dict representation."""
        return {
            "uuid": self.uuid,
            "name": self.name,
            "value": self.value,
            "created": self.created,
            "lastUpdated": self.last_updated,
            "associationIds": self.association_ids,
        }

    def sync_users(self):
        """Sync associated users with the user list in the metadata."""
        if self.name != constants.PROJECT:
            return
        prj_users = [user.get("username") for user in self.value.get("users", [])]
        project_user_query = models.Q(username__in=prj_users)
        admin_user_query = models.Q(username__in=settings.PROJECT_ADMIN_USERS)
        self.users.set(user_model.objects.filter(project_user_query | admin_user_query))

    def save(self, *args, **kwargs):
        if self.name == constants.PROJECT:
            self.base_project = self
        super().save(*args, **kwargs)

    class Meta:
        # Create indexes on name and project ID, since these will be used for lookups.
        indexes = [
            models.Index(models.F("value__projectId"), name="value_project_id"),
            models.Index(fields=["name"]),
        ]

        constraints = [
            # Each project has a unique ID
            models.UniqueConstraint(
                models.F("value__projectId"),
                condition=models.Q(name=constants.PROJECT),
                name="unique_id_per_project",
            ),
            # A project can have at most 1 graph associated to it.
            models.UniqueConstraint(
                fields=["base_project_id"],
                condition=models.Q(name=constants.PROJECT_GRAPH),
                name="unique_graph_per_project",
            ),
            # Top-level project metadata cannot be saved without a project ID.
            models.CheckConstraint(
                check=~models.Q(name=constants.PROJECT, value__projectId__isnull=True),
                name="base_projectId_not_null",
            ),
        ]


@receiver(models.signals.post_save, sender=ProjectMetadata)
def handle_save(instance: ProjectMetadata, **_):
    """After saving a project, update the associated users so that listings can
    be performed."""
    instance.sync_users()
