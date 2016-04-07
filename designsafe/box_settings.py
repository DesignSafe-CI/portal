import os

###
# Settings for Box.com integration
#
BOX_APP_CLIENT_ID = os.environ.get('BOX_APP_CLIENT_ID')
BOX_APP_CLIENT_SECRET = os.environ.get('BOX_APP_CLIENT_SECRET')
BOX_SYNC_FOLDER_NAME = os.environ.get('BOX_SYNC_FOLDER_NAME ', 'DesignSafe-CI-Sync')
BOX_SYNC_AGAVE_SYSTEM = os.environ.get('BOX_SYNC_AGAVE_SYSTEM',
                                       'designsafe.storage.default')
