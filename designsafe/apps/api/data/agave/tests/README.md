## Testing

Tests are based on the next snippets:

**To initialize file manager**
```
    >>> from django.contrib.auth import get_user_model
    >>> from designsafe.apps.api.data.agave import filemanager

    >>> user = get_user_model().objects.get(username = 'xirdneh')
    >>> fm = filemanager.FileManager(user)
```

#Test rename
`>>> fm.file(file_id = 'designsafe.storage.default/xirdneh/DOC19.jpg', action = 'rename', path = 'DOC19_rename.jpg')`

#Test copy
`>>> fm.file(file_id = 'designsafe.storage.default/xirdneh/DOC19.jpg', action = 'copy', path = 'xirdneh/DOC19_copy.jpg')`

#Test move
`>>> fm.file(file_id = 'designsafe.storage.default/xirdneh/DOC19.jpg', action = 'move', path = 'xirdneh/mkdir_test/DOC19.jpg')`

#Test mkdir
`>>> fm.file(file_id = 'designsafe.storage.default/xirdneh', action = 'mkdir', path = 'xirdneh/mkdir_test')` 

#Test move_to_trash
`>>> fm.file(file_id = 'designsafe.storage.default/xirdneh/mkdir_test/DOC19.jpg', action = 'move_to_trash')`

#Test delete
`>>> fm.file(file_id = 'designsafe.storage.default/xirdneh/.Trash/DOC19.jpg', action = 'delete')`
