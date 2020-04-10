from django.db import models
from cms.models import CMSPlugin


class ResponsiveEmbedPlugin(CMSPlugin):
    url = models.CharField(max_length=255)
    aspect = models.CharField(max_length=255,
                              choices=(("16by9", "16by9"), ("4by3", "4by3"), ("podcast", "podcast")))
    allowfullscreen = models.BooleanField(verbose_name='Allow Fullscreen', default=True)

    def __unicode__(self):
        return self.url
