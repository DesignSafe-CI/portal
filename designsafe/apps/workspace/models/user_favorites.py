from django.conf import settings
from django.db import models
from django.contrib.auth.models import User


class UserFavorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tool_id = models.CharField(
        max_length=100
    )  # Consider UUIDField if tool IDs are UUIDs
    added_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "tool_id")  # Prevent duplicates

    def __str__(self):
        return f"{self.user.username} - {self.tool_id}"
