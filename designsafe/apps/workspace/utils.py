"""Workspace Utils"""

import io


def setup_identity_file(username, agave, system, dir_path):
    """Sets up .Identity file for some ipynbs

    :param str username: Username
    :param agave: Agave client
    :param str system: SystemId
    :param str dir_path: Directory path to place `.Identity` file
    """
    # Create directory
    body = {"action": "mkdir", "path": dir_path}
    agave.files.manage(systemId=system, filePath=username, body=body)

    # Create .Identity file with user's username
    identity_file = io.StringIO(username)
    setattr(identity_file, "name", ".Identity")
    return agave.files.importData(
        systemId=system,
        filePath="/{username}/{dir_path}".format(username=username, dir_path=dir_path),
        fileToUpload=identity_file,
        fileName=".Identity",
    )
