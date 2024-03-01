"""Models for the Tools & Applications workspace.
"""

from django.db import models

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

    class Meta:
        verbose_name_plural = "App Categories"


class AppListingEntry(models.Model):
    """Entries for the Tools & Applications workspace, including Tapis, HTML, and Bundled apps.

    ENTRY_TYPES:
        A Tapis App is corresponds to a valid app id registered in the Tapis tenant.

        An HTML or External app is typically an HTML body with a link to an external resource.

        An App Listing Entry (bundle) is both:
            1) a card on the apps CMS layout page that links to an overview page, and
            2) a binned app in the apps workspace, where each app variant is a dropdown item.

        Note: If an App Listing Entry has only one variant, it will be treated as a single app, and not a bundle.
    """

    # Basic display options
    category = models.ForeignKey(
        AppTrayCategory,
        help_text="The category for this app entry.",
        on_delete=models.CASCADE,
    )
    label = models.CharField(
        help_text="The display name of this bundle in the Apps Tray.",
        max_length=64,
        blank=True,
    )
    icon = models.CharField(
        help_text="The icon associated with this app.",
        max_length=64,
        choices=APP_ICONS,
        blank=True,
    )
    enabled = models.BooleanField(
        help_text="App bundle visibility in app tray", default=True
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

    not_bundled = models.BooleanField(
        help_text="Select if this entry represents a single app ID and not a bundle",
        default=False,
    )

    href = models.CharField(
        help_text="Link to overview page for this app.", max_length=128, blank=True
    )

    def __str__(self):
        return (
            f"{self.category} "
            f"{self.label + ': ' if self.label else ''}"
            f" ({'ENABLED' if self.enabled else 'DISABLED'})"
        )

    class Meta:
        verbose_name_plural = "App Listing Entries"


class AppVariant(models.Model):
    """Model to represent a variant of an app, e.g. a software version or execution environment"""

    ENTRY_TYPES = [
        ("tapis", "Tapis App"),
        ("html", "HTML or External app"),
    ]

    app_id = models.CharField(
        help_text="The id of this app or app bundle. The id appears in the unique url path to the app.",
        max_length=64,
    )

    app_type = models.CharField(
        help_text="Application type.",
        max_length=10,
        choices=ENTRY_TYPES,
        default="tapis",
    )

    label = models.CharField(
        help_text="The display name of this app in the Apps Tray.",
        max_length=64,
    )

    license_type = models.CharField(
        max_length=2, choices=LICENSE_TYPES, help_text="License Type.", default="OS"
    )

    bundle = models.ForeignKey(
        AppListingEntry,
        help_text="bundle that the app belongs to",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    # HTML Apps
    html = models.TextField(
        help_text="HTML definition to display when app is loaded.",
        default="",
        blank=True,
    )

    # Tapis Apps
    version = models.CharField(
        help_text="The version number of the app. The app id + version denotes a unique app.",
        default="",
        max_length=64,
        blank=True,
    )

    enabled = models.BooleanField(
        help_text="App variant visibility in app tray", default=True
    )

    def __str__(self):
        return f"{self.bundle.label} {self.app_id} {self.version}  ({'ENABLED' if self.enabled else 'DISABLED'})"
