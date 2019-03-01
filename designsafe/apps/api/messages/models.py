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
    alert_id = models.CharField(max_length=120, unique=True, primary_key=True)
    alert_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='alert-warning')
    alert_message = models.TextField(help_text='Page alert message text.')
    
    def __str__(self):
        return unicode(self).encode('utf-8')

    def __unicode__(self):
        return u"{}".format(self.alert_id)