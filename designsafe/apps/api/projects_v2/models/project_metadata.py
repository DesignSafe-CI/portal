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


def project_admin_users():
    """Get the set of users who should have admin privileges on projects."""
    return user_model.objects.filter(username__in=settings.PROJECT_ADMIN_USERS)


class ProjectMetadata(models.Model):
    """This model represents project metadata. Each entity has a foreign-key relation
    to the base project metadata (the base project relates to itself).

    Some useful operations:
    - list all projects for a user:
      <user>.projects.filter(name="designsafe.project")
    - Get all entities with a given project ID:
      ProjectMetadata.objects.filter(base_project__value__projectId="PRJ-1234")

    """

    uuid = models.CharField(
        max_length=100, primary_key=True, default=uuid_pk, editable=False
    )
    name = models.CharField(max_length=100, validators=[MinLengthValidator(1)])
    value = models.JSONField(encoder=DjangoJSONEncoder)

    users = models.ManyToManyField(to=user_model, related_name="projects")
    base_project = models.ForeignKey("self", on_delete=models.CASCADE)
    created = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)

    @classmethod
    def get_project_by_id(cls, project_id):
        """Return base project metadata matching a project ID value."""
        return cls.objects.get(name=constants.PROJECT, value__projectId=project_id)

    @classmethod
    def get_entities_by_project_id(cls, project_id):
        """Return an iterable of all metadata objects for a given project ID."""
        return cls.objects.filter(base_project__value__projectId=project_id)

    def save(self, *args, **kwargs):
        if self.name == constants.PROJECT:
            self.base_project = self
        super().save(*args, **kwargs)

    def sync_users(self):
        """Sync associated users with the user list in the metadata."""
        if self.name != constants.PROJECT:
            return
        prj_users = [user.get("username") for user in self.value.get("users", [])]
        project_user_query = user_model.objects.filter(username__in=prj_users)
        self.users.set(project_user_query | project_admin_users())

    class Meta:
        indexes = [
            models.Index(models.F("value__projectId"), name="value_project_id"),
            models.Index(fields=["name"]),
        ]


@receiver(models.signals.post_save, sender=ProjectMetadata)
def handle_save(instance: ProjectMetadata, **_):
    """After saving a project, update the associated users so that listings can
    be performed."""
    instance.sync_users()
