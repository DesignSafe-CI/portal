from django.core.management.base import BaseCommand, CommandError
from dsapi.agave.daos import FileManager
from agavepy.agave import Agave
from django.contrib.auth import get_user_model
from designsafe.libs.elasticsearch.api import Object
from requests.exceptions import HTTPError
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Creates/updates missing metadata object for existing files/folders'
    def add_arguments(self, parser):
        parser.add_argument('username', help="Username to impersonate when doing Agave calls")
        parser.add_argument('-l', '--levels', help="Number of levels to recurse and index.", type=int, default = 0)
        parser.add_argument('-s', '--system', help="SystemId to use, defaults to settings.AGAVE_STORAGE_SYSTEM")
        parser.add_argument('-b', '--base_path', help="Base path to start indexing. Defaults at the user's home directory.")
        parser.add_argument('-t', '--trash', help="If set checks for metadata objects marked as deleted and move them to the trash folder.", action='store_true', default=False)
        parser.add_argument('-p', '--pemsindex', help="If set it will index only the permissions", action='store_true', default=False)
        parser.add_argument('-f', '--fullindex', help="If set it will index the full file object with permissions.", action='store_true', default=False)

    def handle(self, *args, **options):
        system_id = options['system'] or settings.AGAVE_STORAGE_SYSTEM
        username = options['username']
        levels = options['levels']
        base_path = options['base_path'] or username
        self.stdout.write('{} {} {}'.format(system_id, username, base_path))
        user = get_user_model().objects.get(username = username)
        if user.agave_oauth.expired:
            user.agave_oauth.refresh()
        ag = Agave(api_server = settings.AGAVE_TENANT_BASEURL,
                   token = user.agave_oauth.token['access_token'])
        mgr = FileManager(ag)

        if base_path:
            base_path = base_path.strip('/')
            username = base_path.split('/')[0]

        if options['trash']:
            r, s = Object().search_marked_deleted(system_id, username, base_path)
            docs_sorted = sorted(s.scan(), key = lambda x: len(x.path.split('/')))
            for o in docs_sorted:
                self.stdout.write('Moving to trash: {}'.format(os.path.join(o.path, o.name)))
                try:
                    trash_filepath = o.path.replace(username, username + '/.Trash', 1)
                    o.update(deleted = False)
                    if not o.path.startswith(username + '/.Trash'): 
                        mgr.move_to_trash(system_id, os.path.join(o.path, o.name), username)
                except HTTPError as e:
                    self.stdout.write('Error {} in path {}'.format(e, os.path.join(o.path, o.name)))
        elif options['pemsindex']:
            mgr.index_permissions(system_id, base_path, username, levels = levels, bottom_up = False)
        elif options['fullindex']:
            mgr.index_full_path(system_id, base_path, username, levels = levels)
        else:
            mgr.index(system_id, base_path, username, levels = levels)
