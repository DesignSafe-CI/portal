from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model, models, signals
from designsafe.apps.rapid.models import RapidNHEvent
from unittest import skip
import mock
import requests_mock
import os, settings

class RapidTests(TestCase):
    """
    Almost all views by anonymous trigger a redirect. However, anonymous CAN create
    tickets. The create ticket view for anonymous includes a Captcha field, so ensure
    that form subclass is activated.
    """

    fixtures = ['user-data.json', ]

    def setUp(self):
        # configure admin user
        user = get_user_model().objects.get(pk=1)
        user.set_password('admin/password')
        user.save()

        # add user to rapid admin group
        g, created = models.Group.objects.get_or_create(name='Rapid Admin')
        user.groups.add(g)
        user.save()

        # configure regular user
        user = get_user_model().objects.get(pk=2)
        user.set_password('user/password')
        user.save()

    def tearDown(self):
        pass

    @skip("Need to mock calls to ES.")
    def test_index(self):
        """
        Test the index view for admin user.
        """
        url = reverse('designsafe_rapid:index')
        self.client.login(username='ds_admin', password='admin/password')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Rapid")

    @skip("Need to mock calls to ES.")
    def test_admin_index_admin(self):
        url = reverse('designsafe_rapid:admin')
        self.client.login(username='ds_admin', password='admin/password')
        resp = self.client.get(url, follow=True)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Rapid Admin")

    @skip("Need to mock calls to ES.")
    def test_admin_index_no_admin(self):
        url = reverse('designsafe_rapid:admin')
        self.client.login(username='ds_user', password='user/password')
        resp = self.client.get(url, follow=True)
        self.assertNotEqual(resp.status_code, 200)

    @skip("Need to mock calls to ES.")
    def test_admin_create_event(self):
        url = reverse('designsafe_rapid:admin_create_event')
        self.client.login(username='ds_admin', password='admin/password')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Create")
    
    '''@mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.client')
    @mock.patch('agavepy.agave.Agave')
    def test_has_agave_file_listing(self, agave_client, agave):
        #agaveclient.return_value.files.list.return_value = [] // whatever the listing should look like
        #request.post.return_value = {} // some object that looks like a requests response
        
        self.client.login(username='test_with_agave', password='test')

        agave_client.files.list.return_value = {
            "name": "test",
            "system": "designsafe.storage.default",
            "trail": [{"path": "/", "name": "/", "system": "designsafe.storage.default"}, 
                    {"path": "/test", "name": "test", "system": "designsafe.storage.default"}],
            "path": "test",
            "type": "dir",
            "children": [],
            "permissions": "READ"
        } '''
    
    
    def test_get_opentopodata_center(self):
        tapipy_mock = mock.MagicMock()
        with open('designsafe/apps/rapid/opentopography_catalog_of_spatial_boundaries_center_points.geojson', 'rb') as file:
            fileContents = file.read()
        tapipy_mock.files.getContents.return_value = fileContents  # Assign byte values of the file contents
        url = reverse('designsafe_rapid:get_opentopodata_center')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "FeatureCollection")

    def test_get_opentopo_coordinates(self):
        tapipy_mock = mock.MagicMock()
        with open('designsafe/apps/rapid/opentopography_catalog_of_spatial_boundaries_full_geometry.geojson', 'rb') as file:
            fileContents = file.read()
        tapipy_mock.files.getContents.return_value = fileContents
        url = reverse('designsafe_rapid:get_opentopo_polygon_coordinates')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "FeatureCollection")

    def test_get_opentopo_coordinates_with_doi(self):
        tapipy_mock = mock.MagicMock()
        with open('designsafe/apps/rapid/opentopography_catalog_of_spatial_boundaries_full_geometry.geojson', 'rb') as file:
            fileContents = file.read()
        tapipy_mock.files.getContents.return_value = fileContents
        url = reverse('designsafe_rapid:get_opentopo_polygon_coordinates', kwargs={'doiUrl': 'https://doi.org/10.5069/G9P55KPR'})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Feature")
