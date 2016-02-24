from agavepy.agave import Agave
import sys, os, imp, requests
FILE_PATH = os.path.split(os.path.realpath(__file__))
DAOS_PATH = os.path.realpath(FILE_PATH[0] + '/../../daos.py')
daos = imp.load_source('daos', DAOS_PATH)

def get_or_create_from_file(agave_client, file_obj):
    af = daos.AgaveFolderFile(agave_client = agave_client, file_obj = file_obj)
    mf = daos.AgaveMetaFolderFile(agave_client = agave_client, meta_obj = af.as_meta_json())
    mf.save()

def check_from_path(agave_client, system_id, file_path):
    try:
        af = daos.AgaveFolderFile.from_path(agave_client = agave_client, system_id = system_id, path = file_path)
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            q = '''{{"name": "object", 
                     "value.name": "{}", 
                     "value.path":"{}", 
                     "value.systemId": "{}"}}'''.format(
                            file_path.split('/')[-1],
                            '/'.join(file_path.split('/')[:-1]),
                            system_id)
            resp = agave_client.meta.listMetadata(q = q)
            if len(resp) == 1:
                m = resp[0]
                print 'about to delete meta with {}'.format(m)
                try:
                    agave_client.meta.deleteMetadata(uuid = m['uuid'])
                except KeyError as e:
                    if e == 'result':
                        print 'metadata deleted'
                    else:
                        raise
            else:
                print 'multiple metadata found'
                for m in resp[1:]:
                    print 'about to delete meta {}'.format(m)
                    agave_client.meta.deleteMetadata(uuid = m['uuid']) 

def main(args):
    cmd = args[0]
    url = args[1]
    token = args[2]
    system_id = args[3]
    base_folder = args[4]
    c = Agave(api_server = url, token = token)
    if cmd == 'files' or cmd == 'files-fix':
        for f in fs_walk(c, system_id, base_folder):
            print f['path']
            if cmd == 'files-fix':
                get_or_create_from_file(agave_client = c, file_obj = f)
    elif cmd == 'meta' or cmd == 'meta-fix':
        for m in meta_walk(c, system_id, base_folder):
            path = m['value']['path'] + '/' + m['value']['name']
            print path
            if cmd == 'meta-fix':
                get_or_create_from_path(agave_client = c, system_id = system_id, file_path = path)

if __name__ == '__main__':
    if len(sys.argv) < 5:
        print 'Usage <command> <api_server> <token> <systemId> <base_folder>'
        print 'commands:\n'
        print 'files'
        print '\t Walk through files and list them.'
        print 'files-fix'
        print '\t Walk through files and create corresponding metadata object if none existent'
        print 'meta'
        print '\t Walk through metadata object in a file structure manner'
        print 'meta-fix'
        print '\t Walk through metadata object in a file structure manner and delete any metadata object that does not have a corresponding file'
    else:
        main(sys.argv[1:])
