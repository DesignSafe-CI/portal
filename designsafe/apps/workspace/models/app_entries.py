from django.db import models
from cms.models import Page as CMSPage


APP_TYPES = [('tapis', 'Tapis'), ('html', 'HTML')]
LICENSE_TYPES = [('OS', 'Open Source'), ('LS', 'Licensed')]


class AppTrayCategory(models.Model):
    category = models.CharField(help_text='A category for the app tray', max_length=64)
    priority = models.IntegerField(help_text='Category priority, where higher priority tabs appear before lower ones', default=0)

    def __str__(self):
        return "%s" % (self.category)


class AppTrayEntry(models.Model):
    label = models.CharField(help_text='The display name of this app in the App Tray', max_length=64, blank=True)
    icon = models.CharField(help_text='The icon to apply to this application', max_length=64, blank=True)
    category = models.ForeignKey(
        AppTrayCategory,
        related_name="+",
        help_text="The App Category for this app entry",
        on_delete=models.CASCADE
    )
    relatedApps = models.ManyToManyField("self", help_text="Related apps that will display on app overview page", blank=True)
    popular = models.BooleanField(help_text='Mark as popular on tools & apps overview', default=True)
    licenseType = models.CharField(max_length=2, choices=LICENSE_TYPES, help_text='License Type', default='OS')

    overview = models.ForeignKey(
        CMSPage,
        related_name="+",
        help_text="The overview page for this app entry. Leave blank if none exists.",
        on_delete=models.CASCADE,
        blank=True
    )

    available = models.BooleanField(help_text='App visibility in app tray', default=True)

    appId = models.CharField(help_text='The id of this app or app bundle. The id appears in the unique url path to the app.', max_length=64)

    class Meta:
        abstract = True


class AppItem(AppTrayEntry):
    """
    Note: uniqueness must be appId + version (even if version does not exist)
    """

    appType = models.CharField(help_text='Application type', max_length=10, choices=APP_TYPES, default='tapis')

    # Tapis Apps
    version = models.CharField(help_text='The version number of the app. The app id + version denotes a unique app', max_length=64, blank=True)

    # HTML Apps
    html = models.TextField(help_text='HTML definition to display when Application is loaded',
                            default="", blank=True)

    def __str__(self):
        if self.appType == "html":
            return "%s: %s (HTML)" % (self.label, self.appId)
        return "%s%s%s" % (
            f"{self.label}: " if self.label else "",
            self.appId,
            f"-{self.version}" if self.version else ""
        )

class AppBundle(AppTrayEntry):
    """
    An AppBundle is :
    1) a card on the apps CMS layout page that links to an overview page, and
    2) a binned app in the apps workspace, where each related app (bundledApps) is a dropdown item.
    """

    bundledApps = models.ManyToManyField("self", help_text="Related apps that will display on app overview page", blank=True)

    def __str__(self):
        return "%s%s%s" % (
            f"{self.label}: " if self.label else "",
            self.appId
        )
