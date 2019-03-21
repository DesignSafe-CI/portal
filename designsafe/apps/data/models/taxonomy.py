from datetime import datetime
from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.validators import ASCIIUsernameValidator




class CustomUser(User):
    username_validator = ASCIIUsernameValidator()

class Vocab(models.Model):
    Term = models.CharField(max_length=40, unique=True)
    Definition = models.TextField(max_length=200)
    Source_of_Definition = models.UrlField(max_length=1000, unique=True)
    Date = DateTimeField(default=datetime.now(), auto_now_add=True)
    VocabBuilder = CustomUser()
    # Permalink = 

class Board(models.Model):
    display = models.CharField(max_length=30, unique=True)
