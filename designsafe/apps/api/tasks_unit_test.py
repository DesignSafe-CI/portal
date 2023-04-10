from django.test import TestCase, RequestFactory
from django.conf import settings
from django.contrib.auth import get_user_model
from mock import patch, MagicMock

TEST_PROJECT = {'uuid': '6262924605326814745-242ac11c-0001-012',
                'schemaId': None, 
                'internalUsername': None,
                'associationIds': [],
                'lastUpdated': '2020-04-17T09:44:42.939-05:00',
                'name': 'designsafe.project',
                'created': "2018-01-18T11:04:35.636000-06:00",
                'owner': "ds_admin",
                'value': {'users':[],
                          'teamMembers': ['autumn88', 'agharag', 'jlwoodr3'],
                          'coPis': ['jdietri1', 'akenned4'],
                          'guestMembers': [],
                          'projectType': 'simulation',
                          'projectId': 'PRJ-2750',
                          'description': 'desc',
                          'pi': 'akenned4',
                          'awardNumber': '12345',
                          'associatedProjects': [], 'ef': 'None', 'keywords': '', 'dois': []},
                'created': '2018-01-18T11:04:35.636-06:00', 'owner': 'ds_admin',
                '_links': {'associationIds': []}}


class TestProjectIndexer(TestCase):

    @patch('designsafe.apps.api.tasks.get_service_account_client')
    def test_project_listing(self, mock_client):
        mock_client().meta.listMetadata.return_value = [TEST_PROJECT]
        from designsafe.apps.api.tasks import list_all_projects
        prj_result = next(list_all_projects())

        mock_client().meta.listMetadata.assert_called_with(q='{"name": "designsafe.project"}', offset=0, limit=100)
        self.assertEqual(prj_result, [TEST_PROJECT])

    @patch('designsafe.apps.api.tasks.bulk')
    @patch('designsafe.apps.projects.models.elasticsearch.IndexedProject')
    def test_project_indexer(self, mock_index, mock_bulk):
        mock_connection = MagicMock()
        mock_index.Index.name = 'designsafe-test-projects'
        mock_index._get_connection.return_value = mock_connection
        from designsafe.apps.api.tasks import index_projects_listing 
        index_projects_listing([TEST_PROJECT])

        expected_doc = {**TEST_PROJECT}
        expected_doc['value']['awardNumber'] = [{'number': '12345'}]
        del expected_doc['_links']

        mock_bulk.assert_called_with(mock_connection, [
            {
                '_index': 'designsafe-test-projects',
                '_id': '6262924605326814745-242ac11c-0001-012',
                'doc': expected_doc,
                '_op_type': 'update',
                'doc_as_upsert': True
            }
        ])

    @patch('designsafe.apps.api.tasks.get_service_account_client')
    @patch('designsafe.apps.api.tasks.index_projects_listing')
    def test_index_or_update_project(self, mock_indexer, mock_client):
        mock_client().meta.listMetadata.return_value = [TEST_PROJECT]
        from designsafe.apps.api.tasks import index_or_update_project
        index_or_update_project('test-uuid')
        mock_client().meta.listMetadata.assert_called_with(q='{"uuid": "test-uuid"}', offset=0, limit=1)
        mock_indexer.assert_called_with([TEST_PROJECT])

    @patch('designsafe.apps.api.tasks.list_all_projects')
    @patch('designsafe.apps.api.tasks.index_projects_listing')
    def test_reindex_projects(self, mock_indexer, mock_listing):
        mock_listing.return_value.__iter__.return_value= [[TEST_PROJECT]]
        from designsafe.apps.api.tasks import reindex_projects
        reindex_projects()
        mock_listing.assert_called_with()
        mock_indexer.assert_called_with([TEST_PROJECT])
