"""Models for the Tools & Applications workspace.
"""

from django.db import models


class AppTrayCategory(models.Model):
    """Categories in which AppTrayEntry items are organized."""

    category = models.CharField(
        help_text="A category for the app tray.", max_length=64, unique=True
    )
    priority = models.IntegerField(
        help_text="Category priority, where higher number tabs appear before lower ones.",
        default=0,
    )

    def __str__(self):
        return f"{self.category}"


class AppTrayEntry(models.Model):
    """Entries for the Tools & Applications workspace, including Tapis, HTML, and Bundled apps.

    ENTRY_TYPES:
        A Tapis App is corresponds to a valid app id registered in the Tapis tenant.

        An HTML or External app is typically an HTML body with a link to an external resource.

        An App Bundle is both:
            1) a card on the apps CMS layout page that links to an overview page, and
            2) a binned app in the apps workspace, where each app in bundled_apps is a dropdown item.
    """

    ENTRY_TYPES = [
        ("tapis", "Tapis App"),
        ("html", "HTML or External app"),
        ("bundle", "App Bundle"),
    ]
    APP_ICONS = [
        ("rwhale", "rWHALE"),
        ("hazmapper", "Hazmapper"),
        ("compress", "Compress"),
        ("opensees", "OpenSees/STKO"),
        ("openfoam", "OpenFOAM"),
        ("blender", "Blender"),
        ("matlab", "MATLAB"),
        ("ngl", "NGL"),
        ("paraview", "Paraview"),
        ("visit", "VisIt"),
        ("jupyter", "Jupyter"),
        ("qgis", "QGIS"),
        ("adcirc", "ADCIRC"),
        ("opensees", "OpenSees"),
        ("ls-dyna", "LS-DYNA"),
        ("dakota", "Dakota"),
        ("clawpack", "Clawpack"),
        ("ansys", "Ansys"),
        ("swbatch", "swbatch"),
        ("extract", "Extract"),
    ]
    LICENSE_TYPES = [("OS", "Open Source"), ("LS", "Licensed")]

    # Basic display options
    app_type = models.CharField(
        help_text="Application type.",
        max_length=10,
        choices=ENTRY_TYPES,
        default="tapis",
    )
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
        choices=APP_ICONS,
        blank=True,
    )
    available = models.BooleanField(
        help_text="App visibility in app tray", default=True
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

    # Bundled Apps
    bundled_apps = models.ManyToManyField(
        "self", help_text="Apps that will be bundled together.", blank=True
    )

    # CMS Display Options
    related_apps = models.ManyToManyField(
        "self",
        help_text="Related apps that will display on app overview page.",
        blank=True,
    )
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
        constraints = [
            models.UniqueConstraint(
                fields=["category", "app_id", "version"],
                name="unique_category_and_id_and_version",
            )
        ]

    def __str__(self):
        return (
            f"{self.app_type}: "
            f"{self.label + ': ' if self.label else ''}"
            f"{self.app_id}"
            f"{'-' + self.version if self.version else ''}"
            f" ({'ENABLED' if self.available else 'DISABLED'})"
        )
