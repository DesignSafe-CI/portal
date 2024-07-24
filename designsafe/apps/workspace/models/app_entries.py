"""Models for the Tools & Applications workspace.
"""

from django.db import models
from django.db.models.functions import Coalesce, Lower

APP_ICONS = [
    ("Generic-App", "Generic: Application"),
    ("Generic-Vis", "Generic: Visualization"),
    ("Earth", "Element: Earth"),
    ("Water", "Element: Water"),
    ("Wind", "Element: Wind"),
    ("All-Hazards", "All Hazards"),
    ("adcirc", "ADCIRC"),
    ("Ansys", "Ansys"),
    ("Blender", "Blender"),
    ("Clawpack", "Clawpack"),
    ("Compress", "Compress"),
    ("Dakota", "Dakota"),
    ("Extract", "Extract"),
    ("GiD", "GiD"),
    ("Hazmapper", "Hazmapper"),
    ("HVSR", "HVSR"),
    ("Jupyter", "Jupyter"),
    ("LS-DYNA", "LS-DYNA"),
    ("MATLAB", "MATLAB"),
    ("MPM", "MPM"),
    ("NGL-without-text", "NGL"),
    ("OpenFOAM", "OpenFOAM"),
    ("OpenSees", "OpenSees"),
    ("Paraview", "Paraview"),
    ("Potree", "Potree"),
    ("QGIS", "QGIS"),
    ("rWHALE", "rWHALE"),
    ("STKO", "STKO"),
    ("SWBatch", "SWBatch"),
]

LICENSE_TYPES = [("OS", "Open Source"), ("LS", "Licensed")]


class AppTag(models.Model):
    """Tags are strings associated with an App Listing Entry item."""

    name = models.CharField(
        help_text="A tag associated with an app.", max_length=64, unique=True
    )

    def __str__(self):
        return f"{self.name}"


class AppTrayCategory(models.Model):
    """Categories in which AppTrayEntry items are organized."""

    category = models.CharField(
        help_text="A category for the app tray.", max_length=64, unique=True
    )
    priority = models.IntegerField(
        help_text="Category priority, where lower number categories appear before higher ones.",
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
        help_text="The display name of this bundle in the Apps Tray. Not used if this entry is a single app ID.",
        max_length=64,
        blank=True,
    )
    icon = models.CharField(
        help_text="The icon associated with this app.",
        max_length=64,
        choices=APP_ICONS,
        blank=True,
    )
    user_guide_link = models.CharField(
        help_text="Link to the app's user guide.",
        max_length=2048,
        blank=True,
    )
    enabled = models.BooleanField(
        help_text="App bundle visibility in app tray.", default=True
    )

    # CMS Display Options
    href = models.CharField(
        help_text="Link to overview page for this app.", max_length=128, blank=True
    )
    description = models.TextField(
        help_text="App bundle description text for tools & apps overview.", blank=True
    )
    tags = models.ManyToManyField(
        AppTag, help_text="App bundle tags for tools & apps overview.", blank=True
    )
    is_popular = models.BooleanField(
        help_text="Mark as popular on tools & apps overview.", default=False
    )
    is_simcenter = models.BooleanField(
        help_text="Mark as 'True' if the app is built by the SimCenter team.",
        default=False,
    )
    license_type = models.CharField(
        max_length=2, choices=LICENSE_TYPES, help_text="License Type.", default="OS"
    )
    related_apps = models.ManyToManyField(
        "self",
        help_text="Related apps that will display on app overview page.",
        blank=True,
    )

    def __str__(self):
        return (
            f"{self.category} "
            f"{self.label + ': ' if self.label else ''}"
            f" ({'ENABLED' if self.enabled else 'DISABLED'})"
        )

    class Meta:
        verbose_name_plural = "App Listing Entries"

        constraints = [
            models.CheckConstraint(
                check=~(models.Q(is_popular=True) & models.Q(is_simcenter=True)),
                name="not_both_popular_and_simcenter",
            )
        ]

        ordering = ["-is_popular", Lower("label")]


class AppVariant(models.Model):
    """Model to represent a variant of an app, e.g. a software version or execution environment"""

    APP_TYPES = [
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
        choices=APP_TYPES,
        default="tapis",
    )

    label = models.CharField(
        help_text="The display name of this app in the Apps Tray. If not defined, uses notes.label from app definition.",
        max_length=64,
        blank=True,
    )

    short_label = models.CharField(
        help_text="The display name of this app in the Apps side navigation. If not defined, uses notes.shortLabel from app definition.",
        max_length=64,
        blank=True,
    )

    bundle = models.ForeignKey(
        AppListingEntry,
        help_text="Bundle that the app belongs to.",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    priority = models.IntegerField(
        help_text="App variant priority, rendered in ascending order.",
        default=0,
    )

    # HTML Apps
    html = models.TextField(
        help_text="HTML definition to display when app is loaded.",
        blank=True,
    )

    description = models.TextField(
        help_text="App variant description text for version overview.",
        blank=True,
        null=True,
    )

    # Tapis Apps
    version = models.CharField(
        help_text="The version number of the app. The app id + version denotes a unique app.",
        default="",
        max_length=64,
        blank=True,
    )

    enabled = models.BooleanField(
        help_text="App variant visibility in app tray.", default=True
    )

    @property
    def href(self):
        """Retrieve the app's URL in the Tools & Applications space"""
        app_href = f"/rw/workspace/{self.app_id}"
        if self.version:
            app_href += f"?appVersion={self.version}"
        return app_href

    def __str__(self):
        return f"{self.bundle.label} {self.app_id} {self.version}  ({'ENABLED' if self.enabled else 'DISABLED'})"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["app_id", "version", "bundle"],
                name="unique_apps_per_bundle",
            )
        ]

        ordering = ["priority", Lower(Coalesce("label", "app_id"))]
