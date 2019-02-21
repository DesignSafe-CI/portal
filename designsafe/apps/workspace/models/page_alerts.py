import logging
from django.db import models

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

class PageAlerts(models.Model):
    alertId = models.CharField(max_length=120, unique=True, primary_key=True)
    alertMessage = models.TextField(help_text='Page alert message text.')

    def __str__(self):
        return unicode(self).encode('utf-8')

    def __unicode__(self):
        return u"%s" % (self.alertId)

    def desc_to_dict(self):
        return {'alertId': self.alertId, 'alertMessage': self.alertMessage}
