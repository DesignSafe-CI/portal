from django.test import TestCase
from mock import patch
from designsafe.apps.api.projects.managers import publication

import logging

logger = logging.getLogger(__name__)


class ProjectDataModelsTestCase(TestCase):
    fixtures = ['user-data.json', 'agave-oauth-token-data.json']

    def setUp(self):
        """Setup"""
        self.exp_pub = {
            'project': {
                'value': {
                    'projectType': 'experimental',
                },
            },
            'experimentsList': [{}, {}, {}],
            'analysisList': [{}, {}, {}],
            'created': '2018-12-17T13:53:12.815888',
        }
        self.sim_pub = {
            'project': {
                'value': {
                    'projectType': 'simulation',
                },
            },
            'simulations': [{}, {}, {}],
            'created': '2018-12-17T13:53:12.815888',
        }
        self.hybrid_sim_pub = {
            'project': {
                'value': {
                    'projectType': 'hybrid_simulation',
                },
            },
            'hybrid_simulations': [{}, {}, {}],
            'created': '2018-12-17T13:53:12.815888',
        }
        self.other_pub = {
            'project': {
                'value': {
                    'projectType': 'other',
                },
            },
            'created': '2018-12-17T13:53:12.815888',
        }

    @patch(
        'designsafe.apps.api.projects.managers.publication.experiment_reserve_xml',
        return_value=['exp_doi', 'exp_ark', 'exp_xml']
    )
    @patch(
        'designsafe.apps.api.projects.managers.publication.analysis_reserve_xml',
        return_value=['anl_doi', 'anl_ark', 'anl_xml']
    )
    @patch(
        'designsafe.apps.api.projects.managers.publication.project_reserve_xml',
        return_value=['proj_doi', 'proj_ark', 'proj_xml']
    )
    @patch('designsafe.apps.api.projects.managers.publication.add_related')
    @patch('designsafe.apps.api.projects.managers.publication._update_doi')
    def test_reserve_publication_experimental(
        self,
        mock_update_doi,
        mock_add_related,
        mock_prj_reserve_xml,
        *mock_methods
    ):
        """Test reserve experimental publication."""
        pub = self.exp_pub
        publication.reserve_publication(pub, analysis_doi=True)
        mock_prj_reserve_xml.assert_called_with(pub)
        for method in mock_methods:
            self.assertEqual(len(method.mock_calls), 3)

        mock_add_related.assert_any_call('exp_xml', ['proj_doi'])
        mock_add_related.assert_any_call('anl_xml', ['proj_doi'])
        mock_add_related.assert_any_call('proj_xml', ['exp_doi'] * 3 + ['anl_doi'] * 3)
        mock_update_doi.assert_any_call('proj_doi', 'proj_xml', status='public')
        mock_update_doi.assert_any_call('exp_doi', 'exp_xml', status='public')
        mock_update_doi.assert_any_call('anl_doi', 'anl_xml', status='public')

    @patch(
        'designsafe.apps.api.projects.managers.publication.simulation_reserve_xml',
        return_value=['sim_doi', 'sim_ark', 'sim_xml']
    )
    @patch(
        'designsafe.apps.api.projects.managers.publication.project_reserve_xml',
        return_value=['proj_doi', 'proj_ark', 'proj_xml']
    )
    @patch('designsafe.apps.api.projects.managers.publication.add_related')
    @patch('designsafe.apps.api.projects.managers.publication._update_doi')
    def test_reserve_publication_sim(
        self,
        mock_update_doi,
        mock_add_related,
        mock_prj_reserve_xml,
        *mock_methods
    ):
        """Test reserve sim publication."""
        pub = self.sim_pub
        publication.reserve_publication(pub)
        mock_prj_reserve_xml.assert_called_with(pub)
        for method in mock_methods:
            self.assertEqual(len(method.mock_calls), 3)

        mock_add_related.assert_any_call('sim_xml', ['proj_doi'])
        mock_add_related.assert_any_call('proj_xml', ['sim_doi'] * 3)
        mock_update_doi.assert_any_call('proj_doi', 'proj_xml', status='public')
        mock_update_doi.assert_any_call('sim_doi', 'sim_xml', status='public')

    @patch(
        'designsafe.apps.api.projects.managers.publication.hybrid_simulation_reserve_xml',
        return_value=['hybrid_sim_doi', 'hybrid_sim_ark', 'hybrid_sim_xml']
    )
    @patch(
        'designsafe.apps.api.projects.managers.publication.project_reserve_xml',
        return_value=['proj_doi', 'proj_ark', 'proj_xml']
    )
    @patch('designsafe.apps.api.projects.managers.publication.add_related')
    @patch('designsafe.apps.api.projects.managers.publication._update_doi')
    def test_reserve_publication_hybrid_sim(
        self,
        mock_update_doi,
        mock_add_related,
        mock_prj_reserve_xml,
        *mock_methods
    ):
        """Test reserve hybrid sim publication."""
        pub = self.hybrid_sim_pub
        publication.reserve_publication(pub)
        mock_prj_reserve_xml.assert_called_with(pub)
        for method in mock_methods:
            self.assertEqual(len(method.mock_calls), 3)

        mock_add_related.assert_any_call('hybrid_sim_xml', ['proj_doi'])
        mock_add_related.assert_any_call('proj_xml', ['hybrid_sim_doi'] * 3)
        mock_update_doi.assert_any_call('proj_doi', 'proj_xml', status='public')
        mock_update_doi.assert_any_call('hybrid_sim_doi', 'hybrid_sim_xml', status='public')

    @patch(
        'designsafe.apps.api.projects.managers.publication.project_reserve_xml',
        return_value=['proj_doi', 'proj_ark', 'proj_xml']
    )
    @patch('designsafe.apps.api.projects.managers.publication.add_related')
    @patch('designsafe.apps.api.projects.managers.publication._update_doi')
    def test_reserve_publication_other(
        self,
        mock_update_doi,
        mock_add_related,
        mock_prj_reserve_xml
    ):
        """Test reserve other publication."""
        pub = self.other_pub
        publication.reserve_publication(pub)
        mock_prj_reserve_xml.assert_called_with(pub)
        mock_update_doi.assert_called_once_with('proj_doi', 'proj_xml', status='public')
