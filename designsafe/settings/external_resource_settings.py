import os

###
# Settings for Box.com integration
#
BOX_APP_CLIENT_ID = os.environ.get('BOX_APP_CLIENT_ID')
BOX_APP_CLIENT_SECRET = os.environ.get('BOX_APP_CLIENT_SECRET')
BOX_SYNC_FOLDER_NAME = os.environ.get('BOX_SYNC_FOLDER_NAME ', 'DesignSafe-CI-Sync')
BOX_SYNC_AGAVE_SYSTEM = os.environ.get('BOX_SYNC_AGAVE_SYSTEM',
                                       'designsafe.storage.default')

###
# Settings for Dropbox.com integration
#
DROPBOX_APP_KEY = os.environ.get('DROPBOX_APP_KEY')
DROPBOX_APP_SECRET = os.environ.get('DROPBOX_APP_SECRET')


###
# Settings for Google Drive integration
#
GOOGLE_OAUTH2_CLIENT_SECRETS_JSON = 'client_secrets.json'
GOOGLE_OAUTH2_SCOPES = ('https://www.googleapis.com/auth/drive',)
GOOGLE_OAUTH2_REQUEST_ATTRIBUTE = 'google_oauth'
GOOGLE_OAUTH2_STORAGE_MODEL = {
    'model': 'designsafe.apps.googledrive_integration.models.GoogleDriveUserToken',
    'user_property': 'user_id',
    'credentials_property': 'credential'
}
