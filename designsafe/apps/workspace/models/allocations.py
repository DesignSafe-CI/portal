"""
Model linking django db user to their TAS allocations + corresponding hosts

"""

from django.db import models
from django.contrib.auth import models as auth_models


class UserAllocations(models.Model):
    """Model establishes one-to-one relation to a user's Django User model + their TAS allocations"""

    user = models.OneToOneField(auth_models.User, on_delete=models.CASCADE)
    value = models.JSONField()
