from agavepy.agave import Agave
import sys
import imp
daos = imp.load_source('daos', '../../daos.py')

CURSOR_UP_ONE = '\x1b[1A'
ERASE_LINE = '\x1b[2K'

def get_or_create_meta(file_obj, agave_client):
    af = daos.AgaveFolderFile(agave_client = agave_client, file_obj = file_obj)
    mf = daos.AgaveMetaFolderFile(agave_client = agave_client, meta_obj = af.as_meta_json())
    mf.save()

def fs_walk(c, system_id, folder, bottom_up = False):
    files = c.files.list(systemId = system_id, filePath = folder)
    for f in files:
        if f['name'] == '.' or f['name'] == '..':
            continue
        if not bottom_up:
            yield f
        if f['format'] == 'folder':
            for sf in fs_walk(c, system_id, f['path'], bottom_up):
                yield sf
        if bottom_up:
            yield f

def main(args):
    url = args[0]
    token = args[1]
    system_id = args[2]
    base_folder = args[3]
    c = Agave(api_server = url, token = token)
    tab = 0
    for f in fs_walk(c, system_id, base_folder):
        print f['path']
        get_or_create_meta(f, c)

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print 'Usage <api_server> <token> <systemId> <base_folder>'
    else:
        main(sys.argv[1:])
