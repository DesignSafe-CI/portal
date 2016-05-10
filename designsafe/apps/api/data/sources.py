from django.conf import settings


class SourcesApi(object):
    _sources = [
        {
            "id": "mydata",
            "resource": "agave",
            "defaultPath": settings.AGAVE_STORAGE_SYSTEM,
            "name": "My data",
            "_extra": {
                "icon": "fa-hdd-o"
            },
            "_actions": ["READ", "WRITE", "EXECUTE"]
        },
        {
            "id": "$share",
            "resource": "agave",
            "defaultPath": '/'.join([settings.AGAVE_STORAGE_SYSTEM, '$share']),
            "name": "Shared with me",
            "_extra": {
                "icon": "fa-group"
            },
            "_actions": ["READ"]
        },
        {
            "id": "public",
            "resource": "public",
            "defaultPath": None,
            "name": "Public data",
            "_extra": {
                "icon": "fa-globe"
            },
            "_actions": ["READ"]
        },
        {
            "id": "box",
            "resource": "box",
            "defaultPath": None,
            "name": "Box.com",
            "_extra": {
                "icon": "fa-square"
            },
            "_actions": ["READ"]
        }
    ]

    def list(self):
        return self._sources

    def get(self, source_id):
        return next(s for s in self._sources if s['id'] == source_id)
