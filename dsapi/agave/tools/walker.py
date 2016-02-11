from dsapi.agave.daos import *

def fs_walk(c, system_id, folder):
    files = c.files.list(systemId = system_id, filePath = folder)
    for f in files:
        if f['name'] == '.' or f['name'] == '..':
            continue
        #print '|' + '-' * tab + af.name
        #if func is not None:
        #    func(f)
        yield f
        if f['format'] == 'folder':
            fs_walk(c, system_id, f['path'])
