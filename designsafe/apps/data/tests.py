from django.test import TestCase, RequestFactory
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.filemanager import FileManager as AgaveFM
from designsafe.apps.api.data.agave.public_filemanager import FileManager as AgavePublicFM
from designsafe.apps.api.data.box.filemanager import FileManager as BoxFM
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.agave.elasticsearch.documents import Object
from designsafe.apps.auth.models import AgaveOAuthToken

from designsafe.apps.data.views.base import DataBrowserTestView

from agavepy.agave import Agave
import mock
import json

import logging


logger = logging.getLogger(__name__)
# Create your tests here.
class DataBrowserBaseTestCase(TestCase):
    fixtures = ['user-data.json', 'agave-oauth-token-data.json']

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password('password')
        user.save()
        self.user = user
        with open('designsafe/apps/api/fixtures/agave_home_listing.json') as f:
            home_listing_json = json.load(f)
        self.agave_listing_json = home_listing_json
        
        with open('designsafe/apps/api/fixtures/object_listing_recursive.json') as f:
            listing_json = json.load(f)
        self.es_listing_json = listing_json
    
    def view_to_test(self, view, request, *args, **kwargs):
		"""Mimic as_view() returned callable, but returns view instance.

		args and kwargs are the same you would pass to ``reverse()``
        
        Shamelessly copied from: http://tech.novapost.fr/django-unit-test-your-views-en.html#mimic-as-view
        Follow ticket: https://code.djangoproject.com/ticket/20456

		"""
		view.request = request
		view.args = args
		view.kwargs = kwargs
		return view

    @mock.patch('agavepy.agave.Agave.__init__')
    @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.refresh')
    def get_filemanager(self, agave_oauth_refresh, agave_init):
        agave_init.return_value = None
        agave_oauth_refresh.return_value = None
        fm = FileManager(self.user)
        return fm

class DataBrowserViewTestCase(DataBrowserBaseTestCase):
    @mock.patch.object(AgavePublicFM, 'listing')
    def test_public_data_anonymous(self, mock_public_listing):
        """Testing anonymouse access to:
             /data/browser
             /data/browser/public
             /data/browser/public/nees.public
             /data/browser/public/nees.public/folder
        """
        urls = [
             '/data/browser',
             '/data/browser/public',
             '/data/browser/public/nees.public',
             '/data/browser/public/nees.public/folder']
        mock_public_listing.return_value = self.es_listing_json
        for url in urls:
            url_components = url.strip('/').split('/')
            resource = None
            file_path = None
            if len(url_components) >= 3:
                resource = url_components[2]
            if len(url_components) > 3:
                file_path = '/'.join(url_components[3:])
            #Create request
            request = RequestFactory().get(url)
            request.user = AnonymousUser()
            #Initi view
            test_view = DataBrowserTestView()
            #Setup view for testing
            test_view = self.view_to_test(test_view, request, 
                                resource = resource, file_path = file_path)
            #We're just going to get the context data.
            context = test_view.get_context_data(**test_view.kwargs)
            angular_init = json.loads(context['angular_init'])
            keys = angular_init.keys()
            self.assertIn('currentSource', keys)
            self.assertIn('sources', keys)
            self.assertIn('listing', keys)
            self.assertIn('state', keys)
            self.assertIsNotNone(angular_init['currentSource'])
            self.assertIsNotNone(angular_init['sources'])
            self.assertIsNotNone(angular_init['listing'])
            self.assertIsNotNone(angular_init['state'])
            self.assertIsNotNone(angular_init['state']['search'])
            
            if len(url_components) <= 3:
                mock_public_listing.assert_called_with(None)
            else:
                mock_public_listing.assert_called_with('/'.join(url_components[3:]))
