import json
import logging
from unittest import skip
from elasticsearch_dsl import Q
from django.test import TestCase
from django.contrib.auth import get_user_model, signals
from django.contrib.auth.models import Permission
from django.urls import reverse
from designsafe.apps.data.models.elasticsearch import IndexedFile

logger = logging.getLogger(__name__)


@skip("Need to mock Elasticsearch calls")
class DashboardTests(TestCase):

    fixtures = ["user-data.json"]

    def setUp(self):
        # configure regular user
        user = get_user_model().objects.get(pk=2)
        user.set_password("user/password")
        user.save()
        f1 = IndexedFile(
            length=1,
            path="ds_user/test",
        )
        f1.save(refresh=True)
        f2 = IndexedFile(
            length=1,
            path="ds_user/test",
        )
        f2.save(refresh=True)

    def tearDown(self):
        s = IndexedFile.search()
        res = s.query("bool", must=[Q("match", **{"path._path": "ds_user"})]).extra(
            size=10000
        )
        res.execute()
        # for doc in res:
        #    doc.delete(refresh=True, ignore=404)

    def test_dashboard_index(self):
        url = reverse("designsafe_dashboard:index")
        self.client.login(username="ds_user", password="user/password")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)

    @skip("Skiping for now. TODO: Figure out what's up")
    def test_dashboard_agg_storage(self):

        url = reverse("designsafe_api:user_usage")
        self.client.login(username="ds_user", password="user/password")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.content)
        logger.debug("data: %s", data)
        self.assertEqual(data["total_storage_bytes"], 2)
