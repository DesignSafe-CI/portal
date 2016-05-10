from functools import wraps

def _parse_file_id(file_id):
    """
    Returns `system_id`, `file_user` and `file_path` from a
    `file_id` string.

    Examples:
        `file_id` can look like this:
          `designsafe.storage.default`:
          Points to the root folder in the 
          `designsafe.storage.default` filesystem.

          `designsafe.stroage.default/username`:
          Points to the home directory of the user `username`.

          `designsafe.storage.default/username/folder`:
          Points to the folder `folder` in the home directory
          of the user `username`.

          `designsafe.stroage.default/username/folder/file.txt`:
          Points to the file `file.txt` in the home directory
          of the username `username`
    
    Args:
        file_id: String with the format 
        <filesystem id>[ [ [/ | /<username> [/ | /<file_path>] ] ] ]

    Returns:
        A list with three elements
        index 0 `system_id`: String. Filesystem id 
        index 1 `file_user`: String. Home directory's username of the 
                             file the `file_id` points to.
        index 2 `file_path`: String. Complete file path.

    Raises:
        ValueError: If the object is not in the desired format.

    """
    if file_id is None or file_id == '':
        raise ValueError('Could not split %s object' % file_id)
    
    components = file_id.strip('/').split('/')
    system_id = components[0] if len(components) >= 1 else None
    file_path = '/'.join(components[1:]) if len(components) >= 2 else '/'
    file_user = components[1] if len(components) >= 2 else None

    return system_id, file_user, file_path

def file_id_decorator(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        system, file_user, file_path = _parse_file_id(kwargs.get('file_id'))
        kwargs['system'] = system
        kwargs['file_path'] = file_path
        kwargs['file_user'] = file_user
        return f(*args, **kwargs)
    return wrapper
