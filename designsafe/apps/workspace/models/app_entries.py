from django.db import models


APP_ICONS = [
    "rWHALE",
    "Hazmapper",
    "Compress",
    "OpenSees-STKO",
    "STKO",
    "OpenFOAM",
    "Blender",
    "MATLAB",
    "NGL",
    "Paraview",
    "VisIt",
    "Jupyter",
    "QGIS",
    "ADCIRC",
    "OpenSees",
    "LS-DYNA",
    "LS-Pre/Post",
    "Dakota",
    "Clawpack",
    "Ansys",
    "swbatch",
    "Extract",
]


def _get_icon_choices():
    return [(i.lower(), i) for i in APP_ICONS]


class AppTrayCategory(models.Model):
    category = models.CharField(
        help_text="A category for the app tray.", max_length=64, unique=True
    )
    priority = models.IntegerField(
        help_text="Category priority, where higher number tabs appear before lower ones.",
        default=0,
    )

    def __str__(self):
        return "%s" % (self.category)


class AppTrayEntry(models.Model):
    LICENSE_TYPES = [("OS", "Open Source"), ("LS", "Licensed")]

    # Basic display options
    app_id = models.CharField(
        help_text="The id of this app or app bundle. The id appears in the unique url path to the app.",
        max_length=64,
    )
    category = models.ForeignKey(
        AppTrayCategory,
        help_text="The category for this app entry.",
        on_delete=models.CASCADE,
    )
    label = models.CharField(
        help_text="The display name of this app in the Apps Tray.",
        max_length=64,
        blank=True,
    )
    icon = models.CharField(
        help_text="The icon associated with this app.",
        max_length=64,
        choices=_get_icon_choices(),
        blank=True,
    )
    available = models.BooleanField(
        help_text="App visibility in app tray", default=True
    )

    # CMS specific display options
    popular = models.BooleanField(
        help_text="Mark as popular on tools & apps overview.", default=False
    )
    license_type = models.CharField(
        max_length=2, choices=LICENSE_TYPES, help_text="License Type.", default="OS"
    )
    overview = models.CharField(
        help_text="Link to overview page for this app.", max_length=128, blank=True
    )

    class Meta:
        abstract = True


class AppItem(AppTrayEntry):
    APP_TYPES = [("tapis", "Tapis"), ("html", "HTML")]

    app_type = models.CharField(
        help_text="Application type.", max_length=10, choices=APP_TYPES, default="tapis"
    )

    # Tapis Apps
    version = models.CharField(
        help_text="The version number of the app. The app id + version denotes a unique app.",
        max_length=64,
        blank=True,
    )

    # HTML Apps
    html = models.TextField(
        help_text="HTML definition to display when app is loaded.",
        default="",
        blank=True,
    )

    # CMS Display Option
    related_apps = models.ManyToManyField(
        "self",
        help_text="Related apps that will display on app overview page.",
        blank=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["category", "app_id", "version"],
                name="unique_category_and_id_and_version",
            )
        ]

    def __str__(self):
        if self.app_type == "html":
            return "%s: %s (HTML)" % (self.label, self.app_id)
        return "%s%s%s" % (
            f"{self.label}: " if self.label else "",
            self.app_id,
            f"-{self.version}" if self.version else "",
        )


class AppBundle(AppTrayEntry):
    """
    An AppBundle is :
    1) a card on the apps CMS layout page that links to an overview page, and
    2) a binned app in the apps workspace, where each app in bundled_apps is a dropdown item.
    """

    bundled_apps = models.ManyToManyField(
        AppItem,
        related_name="app_bundle",
        help_text="Apps that will be bundled together.",
    )

    # CMS Display Option
    related_apps = models.ManyToManyField(
        AppItem,
        related_name="+",
        help_text="Related apps that will display on app overview page.",
        blank=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["category", "app_id"], name="unique_category_and_id"
            )
        ]

    def __str__(self):
        return "%s%s" % (f"{self.label}: " if self.label else "", self.app_id)
