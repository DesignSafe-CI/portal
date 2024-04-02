import logging
from django.db import models

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class AppDescription(models.Model):
    appid = models.CharField(max_length=120, unique=True, primary_key=True)
    appdescription = models.TextField(
        help_text="App dropdown description text for apps that have a dropdown."
    )

    def __str__(self):
        return "%s" % (self.appid)

    def desc_to_dict(self):
        return {"appId": self.appid, "appDescription": self.appdescription}
