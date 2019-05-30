from datetime import datetime
from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.validators import ASCIIUsernameValidator


class CustomUser(User):
    username_validator = ASCIIUsernameValidator()

class Vocab(models.Model):
    term = models.CharField(max_length=40, unique=True)
    definition = models.TextField(max_length=200)
    source_of_definition = models.UrlField(max_length=1000, unique=True)
    date = DateTimeField(default=datetime.now(), auto_now_add=True)
    vocab_builder = CustomUser()
    user = models.ForeignKey(settings.ASCIIUsernameValidator)

class Board(models.Model):
    display = models.CharField(max_length=30, unique=True)
