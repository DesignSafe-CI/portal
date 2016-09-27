from django.core.management.base import BaseCommand, CommandError
from designsafe.apps.api.data.agave.filemanager import FileManager
from agavepy.agave import Agave
from django.contrib.auth import get_user_model
from designsafe.apps.api.data.agave.elasticsearch.documents import Object
from requests.exceptions import HTTPError
from django.conf import settings
from time import time
import os

admin_user = 'ds_admin'

class Command(BaseCommand):
    help = 'Clears permissions on metadata objects'
    def add_arguments(self, parser):
        parser.add_argument('file_path', 
            help="File path to start traversing. Use '/' if you want to start from root")
        parser.add_argument('-u', '--username',
            help="Username to remove in permissions array")
        parser.add_argument('-s', '--system', 
                help="SystemId to use, defaults to settings.AGAVE_STORAGE_SYSTEM")

    def _clear_pems(self, doc, username):
        self.stdout.write(doc.full_path)
        owner = doc.full_path.strip('/').split('/')[0]
        if username:
            pems += filter(lambda x: x['username'] != username, doc.permissions)
        else:
            pems = [
                {'username': owner,
                 'recursive': True,
                 'permission': {
                     'read': True,
                     'write': True,
                     'execute': True,
                 }
                },
                {'username': 'ds_admin',
                 'recursive': True,
                 'permission': {
                     'read': True,
                     'write': True,
                     'execute': True,
                 }
                }
            ]

        doc.update(permissions = pems)
        doc.save()
        return doc

    def handle(self, *args, **options):
        t0 = time()
        system_id = options['system'] or settings.AGAVE_STORAGE_SYSTEM
        username = options['username']
        file_path = options['file_path']
        self.stdout.write('Starting at: {}'.format(file_path))
        self.stdout.write('Clearing permissions for username: {}'.format(username))
        res, root_folders = Object.listing(system_id, admin_user, file_path)
        self.stdout.write('Documents meta: {}'.format({'index': res[0].meta.index,
                                                       'doc_type': res[0].meta.doc_type}))
        cnt = 0
        #for folder in root_folders.scan():
        s = Object.search()
        res = s.execute()
        for folder in s.scan():
            self._clear_pems(folder, username)
            cnt += 1
            owner = folder.full_path.strip('/').split('/')[0]
            res, listing = Object.listing_recursive(system_id, owner,
                                                    folder.full_path.strip('/'))
            for doc in listing.scan():
                self._clear_pems(doc, username)
                cnt += 1
        t1 = time()
        self.stdout.write('Accurate enough running time: {} s'.format(t1 - t0))
        self.stdout.write('Total number of docs touched: {}'.format(str(cnt)))
