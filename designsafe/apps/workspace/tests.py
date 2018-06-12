from django.test import TestCase
from django.urls import resolve, reverse

from .views import index


class IndexTests(TestCase):
    def Test_index_view_status_code(self):
        url = reverse('index')
        response = self.client.get(url)
        self.assertEquals(response.status_code, 200)