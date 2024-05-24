"""
Model linking django db user to their TAS allocations + corresponding hosts

"""

from django.db import models
from django.contrib.auth.models import User

class UserAllocations(models.Model):
    """ Model establishes one-to-one relation to a user's Django User model + their TAS allocations """
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    value = models.JSONField()
