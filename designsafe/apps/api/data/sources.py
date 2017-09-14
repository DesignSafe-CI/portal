from django.conf import settings


class SourcesApi(object):
    @property
    def sources(self):
        _sources = [
            {
                "id": "mydata",
                "resource": "agave",
                "defaultPath": settings.AGAVE_STORAGE_SYSTEM,
                "name": "My data",
                "_visible": True,
                "_indexed": True,
                "_extra": {
                    "icon": "fa-hdd-o"
                },
            },
            {
                "id": "myprojects",
                "resource": "projects",
                "defaultPath": "designsafe.storage.projects",
                "name": "My projects",
                "_visible": True,
                "_indexed": True,
                "_extra": {
                    "icon": "fa-briefcase"
                },
            },
            {
                "id": "$share",
                "resource": "agave",
                "defaultPath": '/'.join([settings.AGAVE_STORAGE_SYSTEM, '$share']),
                "name": "Shared with me",
                "_visible": True,
                "_indexed": True,
                "_extra": {
                    "icon": "fa-group"
                },
            },
            {
                "id": "public",
                "resource": "public",
                "defaultPath": None,
                "name": "Public data",
                "_visible": True,
                "_indexed": True,
                "_extra": {
                    "icon": "fa-globe"
                },
            },
            {
                "id": "community",
                "resource": "agave",
                "defaultPath": None,
                "name": "Community data",
                "_visible": True,
                "_indexed": True,
                "_extra": {
                    "icon": "fa-globe"
                },
            },
            {
                "id": "box",
                "resource": "box",
                "defaultPath": None,
                "name": "Box.com",
                "_visible": True,
                "_indexed": False,
                "_extra": {
                    "icon": "fa-square"
                },
            },
            {
                "id": "dropbox",
                "resource": "dropbox",
                "defaultPath": None,
                "name": "Dropbox.com",
                "_visible": True,
                "_indexed": False,
                "_extra": {
                    "icon": "fa-square"
                },
            }
        ]

    def list(self):
        return self.sources

    def get(self, source_id):
        return next(s for s in self.sources if s['id'] == source_id)
