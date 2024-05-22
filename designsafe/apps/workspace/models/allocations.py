from django.db import models
from django.contrib.auth.models import User

"""
Model linking django db user to their TAS allocations + corresponding hosts

"""

class UserAllocations(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    value = models.JSONField()
