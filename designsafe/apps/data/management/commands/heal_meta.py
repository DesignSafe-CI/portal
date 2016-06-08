from django.core.management.base import BaseCommand, CommandError
from designsafe.apps.api.data.agave.filemanager import FileManager
from agavepy.agave import Agave
from django.contrib.auth import get_user_model
from designsafe.libs.elasticsearch.api import Object
from requests.exceptions import HTTPError
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Creates/updates missing metadata object for existing files/folders'
    def add_arguments(self, parser):
        parser.add_argument('username', 
                help="Username to impersonate when doing Agave calls",
                required=True)
        parser.add_argument('-l', '--levels', 
                help="Number of levels to recurse and index.", 
                type=int, 
                default = 0)
        parser.add_argument('-s', '--system', 
                help="SystemId to use, defaults to settings.AGAVE_STORAGE_SYSTEM")
        parser.add_argument('-b', '--base_path', 
                help="Base path to start indexing. Defaults at the user's home directory.")
        parser.add_argument('-p', '--pemsindex', 
                help="If set it will index only the permissions.", 
                action='store_true', 
                default=False)
        parser.add_argument('-f', '--fullindex', 
                help="If set it will index the full file object with permissions.", 
                action='store_true', 
                default=False)
        parser.add_argument('-A', '--all-users',
                help="If set it will loop through all the users in the DB.",
                action='store_true',
                default=False)

        #parser.add_argument('-t', '--trash', 
        #        help="""If set checks for metadata objects marked as deleted and 
        #                move them to the trash folder.""", 
        #        action='store_true', 
        #        default=False)

    def _get_users(self, *args, **options): 
        all_users = options['all-users']
        base_path = options['base_path'] or username
        if not all_users:
            if base_path:
                base_path = base_path.strip('/')
                #If the agaveclient is created with a super user the 
                #"optimist permissions" should use the path's username.
                username = base_path.split('/')[0]
            return [username]
        else:
            um = get_user_model()
            return [o.username for o in um.objects.all()]

    def handle(self, *args, **options):
        system_id = options['system'] or settings.AGAVE_STORAGE_SYSTEM
        username = options['username']
        levels = options['levels']
        base_path = options['base_path'] or username
        self.stdout.write('Indexing: {}/{}'.format(system_id, base_path)) 
        self.stdout.write('Impersonating: {}'.format(username))
        user = get_user_model().objects.get(username = username)
        mgr = FileManager(user)

        usernames = self._get_users(*args, **options)

        for username in usernames:
            if options['pemsindex']:
                self.stdout.write('Indexing permissions only with username: %s.' % username)
                mgr.indexer.index_permissions(system_id, 
                                base_path, username, levels = levels, bottom_up = False)
            elif options['fullindex']:
                self.stdout.write('Full Indexing with username: %s' % username)
                mgr.indexer.index(system_id, 
                                base_path, username, full_indexing = True, levels = levels)
            else:
                self.stdout.write('Normal Indexing with username: %s' % username)
                mgr.indexer.index(system_id, base_path, username, levels = levels)

        #if options['trash']:
        #    r, s = Object().search_marked_deleted(system_id, username, base_path)
        #    docs_sorted = sorted(s.scan(), key = lambda x: len(x.path.split('/')))
        #    for o in docs_sorted:
        #        self.stdout.write('Moving to trash: {}'.format(os.path.join(o.path, o.name)))
        #        try:
        #            trash_filepath = o.path.replace(username, username + '/.Trash', 1)
        #            o.update(deleted = False)
        #            if not o.path.startswith(username + '/.Trash'): 
        #                mgr.move_to_trash(system_id, os.path.join(o.path, o.name), username)
        #        except HTTPError as e:
        #            self.stdout.write('Error {} in path {}'.format(e, os.path.join(o.path, o.name)))
