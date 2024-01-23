# Generated by Django 4.2.6 on 2024-01-23 22:37

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    replaces = [
        ("workspace", "0003_apptraycategory_appitem_appbundle"),
        ("workspace", "0004_alter_appbundle_overview_alter_appitem_overview"),
        (
            "workspace",
            "0005_alter_appbundle_bundledapps_alter_appbundle_popular_and_more",
        ),
    ]

    dependencies = [
        ("cms", "0022_auto_20180620_1551"),
        ("workspace", "0002_auto_20200423_1940"),
    ]

    operations = [
        migrations.CreateModel(
            name="AppTrayCategory",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "category",
                    models.CharField(
                        help_text="A category for the app tray", max_length=64
                    ),
                ),
                (
                    "priority",
                    models.IntegerField(
                        default=0,
                        help_text="Category priority, where higher priority tabs appear before lower ones",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="AppItem",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "label",
                    models.CharField(
                        blank=True,
                        help_text="The display name of this app in the App Tray",
                        max_length=64,
                    ),
                ),
                (
                    "icon",
                    models.CharField(
                        blank=True,
                        help_text="The icon to apply to this application",
                        max_length=64,
                    ),
                ),
                (
                    "popular",
                    models.BooleanField(
                        default=False,
                        help_text="Mark as popular on tools & apps overview",
                    ),
                ),
                (
                    "licenseType",
                    models.CharField(
                        choices=[("OS", "Open Source"), ("LS", "Licensed")],
                        default="OS",
                        help_text="License Type",
                        max_length=2,
                    ),
                ),
                (
                    "available",
                    models.BooleanField(
                        default=True, help_text="App visibility in app tray"
                    ),
                ),
                (
                    "appId",
                    models.CharField(
                        help_text="The id of this app or app bundle. The id appears in the unique url path to the app.",
                        max_length=64,
                    ),
                ),
                (
                    "appType",
                    models.CharField(
                        choices=[("tapis", "Tapis"), ("html", "HTML")],
                        default="tapis",
                        help_text="Application type",
                        max_length=10,
                    ),
                ),
                (
                    "version",
                    models.CharField(
                        blank=True,
                        help_text="The version number of the app. The app id + version denotes a unique app",
                        max_length=64,
                    ),
                ),
                (
                    "html",
                    models.TextField(
                        blank=True,
                        default="",
                        help_text="HTML definition to display when Application is loaded",
                    ),
                ),
                (
                    "category",
                    models.ForeignKey(
                        help_text="The App Category for this app entry",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="workspace.apptraycategory",
                    ),
                ),
                (
                    "overview",
                    models.CharField(
                        blank=True,
                        help_text="Link to overview page for this app.",
                        max_length=128,
                    ),
                ),
                (
                    "relatedApps",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Related apps that will display on app overview page",
                        to="workspace.appitem",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="AppBundle",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "label",
                    models.CharField(
                        blank=True,
                        help_text="The display name of this app in the App Tray",
                        max_length=64,
                    ),
                ),
                (
                    "icon",
                    models.CharField(
                        blank=True,
                        help_text="The icon to apply to this application",
                        max_length=64,
                    ),
                ),
                (
                    "popular",
                    models.BooleanField(
                        default=False,
                        help_text="Mark as popular on tools & apps overview",
                    ),
                ),
                (
                    "licenseType",
                    models.CharField(
                        choices=[("OS", "Open Source"), ("LS", "Licensed")],
                        default="OS",
                        help_text="License Type",
                        max_length=2,
                    ),
                ),
                (
                    "available",
                    models.BooleanField(
                        default=True, help_text="App visibility in app tray"
                    ),
                ),
                (
                    "appId",
                    models.CharField(
                        help_text="The id of this app or app bundle. The id appears in the unique url path to the app.",
                        max_length=64,
                    ),
                ),
                (
                    "bundledApps",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Apps that will be bundled together",
                        related_name="+",
                        to="workspace.appitem",
                    ),
                ),
                (
                    "category",
                    models.ForeignKey(
                        help_text="The App Category for this app entry",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="workspace.apptraycategory",
                    ),
                ),
                (
                    "overview",
                    models.CharField(
                        blank=True,
                        help_text="Link to overview page for this app.",
                        max_length=128,
                    ),
                ),
                (
                    "relatedApps",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Related apps that will display on app overview page",
                        related_name="+",
                        to="workspace.appitem",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
    ]
