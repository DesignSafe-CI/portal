from agavepy.agave import Agave
from .daos import *

def fs_walk(agave_client, system_id, folder, bottom_up = False, yield_base = True):
    try:
        files = agave_client.files.list(systemId = system_id, filePath = folder)
    except requests.exceptions.HTTPError as e:
        print '{}: {}, {}'.format(e.code, system_id, folder)
        raise
    for f in files:
        if f['name'] == '.' or f['name'] == '..':
            if not yield_base:
                continue
        if not bottom_up:
            yield f
        if f['format'] == 'folder':
            for sf in fs_walk(c, system_id, f['path'], bottom_up, False):
                yield sf
        if bottom_up:
            yield f

def meta_walk(agave_client, system_id, folder, bottom_up = False):
    q = '{{"name": "object", "value.path": "{}", "value.systemId": "{}", "value.deleted": "false"}}'.format(folder, system_id)
    metas = agave_client.meta.listMetadata(q = q)
    for m in metas:
        if not bottom_up:
            yield m
        if m['value']['type'] == 'folder':
            for sm in meta_walk(c, system_id, m['value']['path'] + '/' + m['value']['name'], bottom_up):
                yield sm
        if bottom_up:
            yield m

def get_or_create_from_file(agave_client, file_obj):
    af = AgaveFolderFile(agave_client = agave_client, file_obj = file_obj)
    mf = AgaveMetaFolderFile(agave_client = agave_client, meta_obj = af.as_meta_json())
    mf.save()

def check_from_path(agave_client, system_id, file_path):
    try:
        af = AgaveFolderFile.from_path(agave_client = agave_client, system_id = system_id, path = file_path)
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


