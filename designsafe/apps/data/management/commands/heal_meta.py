from django.core.management.base import BaseCommand, CommandError
from dsapi.agave.daos import AgaveFilesManager
from agavepy.agave import Agave
from django.contrib.auth import get_user_model
from designsafe.libs.elasticsearch.api import Object
from django.conf import settings

class Command(BaseCommand):
    help = 'Creates/updates missing metadata object for existing files/folders'
    def add_arguments(self, parser):
        parser.add_argument('username', help="Username to impersonate when doing Agave calls")
        parser.add_argument('-s', '--system', help="SystemId to use, defaults to settings.AGAVE_STORAGE_SYSTEM")
        parser.add_argument('-b', '--base_path', type="Base path to start indexing. Defaults at the user's home directory.")

    def handle(self, *args, **options):
        system_id = options['system_id'] or settings.AGAVE_STORAGE_SYSTEM
        username = options['username']
        base_path = options['base_path'] or username
        user = get_user_model().objects.get(username = username)
        if user.agave_oauth.expired:
            user.agave_oauth.refresh()
        ag = Agave(api_server = settings.AGAVE_TENANT_BASEURL,
                   token = user.agave_oauth.token['access_token'])
        mgr = AgaveFilesManager(ag)
        mgr.index(system_id, base_path, username)
