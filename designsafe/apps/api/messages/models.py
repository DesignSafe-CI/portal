from __future__ import unicode_literals
import logging
from django.db import models

logger = logging.getLogger(__name__)
TYPE_CHOICES = (
    ('alert-warning', 'WARNING'),
    ('alert-danger', 'DANGER'),
    ('alert-info', 'INFO'),
    ('alert-success', 'SUCCESS'),
    )

class PageAlert(models.Model):
    name = models.CharField(max_length=120, unique=True, primary_key=True)
    alert_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='alert-warning')
    message = models.TextField(help_text='Page alert message text.')
    is_active = models.BooleanField(default=False)
    
    def __str__(self):
        return '{name}: {alert_type} - {message}...'.format(
            name=self.name,
            alert_type=self.alert_type,
            message=self.message[0:50]
        )

    def __repr__(self):
        return {
            'name':self.name,
            'alert_type':self.alert_type,
            'message':self.message,
            'is_active':self.is_active
        }
