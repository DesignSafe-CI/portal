from django.urls import reverse


def provide_integrations():
    return [
        {
            "label": "GoogleDrive",
            "href": reverse("googledrive_integration:index"),
            "description": "Access files from your Google Drive account in DesignSafe.",
        },
    ]
