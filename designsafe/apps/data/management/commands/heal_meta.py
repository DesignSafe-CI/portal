from django.core.management.base import BaseCommand, CommandError
from dsapi.agave import utils as agave_utils
from agavepy.agave import Agave
from django.contrib.auth import get_user_model
from designsafe.libs.elasticsearch.api import Object

class Command(BaseCommand):
    help = 'Creates/updates missing metadata object for existing files/folders'
    def add_arguments(self, parser):
        parser.add_argument('system_id', type=str)
        parser.add_argument('username', type=str)
        parser.add_argument('base_path', type=str)

    def handle(self, *args, **options):
        system_id = options['system_id']
        username = options['username']
        base_path = options['base_path']
        self.stdout.write('username: {}'.format(username))
        me = get_user_model().objects.get(username=username)
        me.agave_oauth.refresh()

        ag = Agave(api_server='https://agave.designsafe-ci.org/',
               token=me.agave_oauth.access_token)
        
        self.stdout.write('Cheking metadata...')
        for f in agave_utils.fs_walk(agave_client = ag, system_id = system_id, folder = base_path):
            self.stdout.write(f['path'])
            fo = agave_utils.get_folder_obj(agave_client = ag, file_obj = f)
            o = Object.get(id = fo.uuid, ignore=404)
            #if o is not None:
            #    o.delete()
            if o is None:
                o = Object(**fo.to_dict())
                o.save()
            else:
                fo.deleted = False
                o.update_from_dict(**fo.to_dict())
