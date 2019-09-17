import logging
import os
import base64
import pickle
from google.auth.transport.requests import Request
from googleapiclient import discovery
from django.conf import settings
from django.db import models
from django.utils import encoding
import google.oauth2.credentials
import jsonpickle

logger = logging.getLogger(__name__)

CLIENT_SECRETS_FILE = os.path.join(settings.SITE_DIR, 'client_secrets.json')


class CredentialsField(models.Field):
    """Django ORM field for storing OAuth2 Credentials."""

    def __init__(self, *args, **kwargs):
        if 'null' not in kwargs:
            kwargs['null'] = True
        super(CredentialsField, self).__init__(*args, **kwargs)

    def get_internal_type(self):
        return 'BinaryField'

    def from_db_value(self, value, expression, connection, context):
        """Overrides ``models.Field`` method. This converts the value
        returned from the database to an instance of this class.
        """
        return self.to_python(value)

    def to_python(self, value):
        """Overrides ``models.Field`` method. This is used to convert
        bytes (from serialization etc) to an instance of this class"""
        if value is None:
            return None
        elif isinstance(value, google.oauth2.credentials.Credentials):
            return value
        else:
            try:
                return jsonpickle.decode(
                    base64.b64decode(encoding.smart_bytes(value)).decode())
            except ValueError:
                return pickle.loads(
                    base64.b64decode(encoding.smart_bytes(value)))

    def get_prep_value(self, value):
        """Overrides ``models.Field`` method. This is used to convert
        the value from an instance of this class to bytes that can be
        inserted into the database.
        """
        if value is None:
            return None
        else:
            return encoding.smart_text(
                base64.b64encode(jsonpickle.encode(value).encode()))

    def value_to_string(self, obj):
        """Convert the field value from the provided model to a string.

        Used during model serialization.

        Args:
            obj: db.Model, model object

        Returns:
            string, the serialized field value
        """
        value = self._get_val_from_obj(obj)
        return self.get_prep_value(value)


class GoogleDriveUserToken(models.Model):
    """
    Represents an OAuth Token for a Google Drive user
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='googledrive_user_token',
                                on_delete=models.deletion.SET_NULL)
    credential = CredentialsField()

    @property
    def client(self):
        if not self.credential.valid:
            request = Request()
            self.credential.refresh(request)
        drive = discovery.build('drive', 'v3', credentials=self.credential)
        return drive
