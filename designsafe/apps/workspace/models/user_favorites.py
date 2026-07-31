"""
Models related to user favorites functionality.
"""

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class UserFavorite(models.Model):
    """Model to store user favorite tools."""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tool_id = models.CharField(
        max_length=100
    )  # Consider UUIDField if tool IDs are UUIDs
    added_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "tool_id")  # Prevent duplicates

    def __str__(self):
        return f"{self.user.username} - {self.tool_id}"
