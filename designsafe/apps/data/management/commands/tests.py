from mock import Mock, patch, MagicMock, PropertyMock, call
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.management import call_command
import datetime


class TestSwapReindex(TestCase):

    def setUp(self):
        self.patch_setup = patch(
            "designsafe.apps.data.management.commands.swap_reindex.setup_index"
        )
        self.patch_connections = patch(
            "designsafe.apps.data.management.commands.swap_reindex.connections"
        )
        self.patch_elasticsearch = patch(
            "designsafe.apps.data.management.commands.swap_reindex.elasticsearch"
        )

        self.mock_setup = self.patch_setup.start()
        self.mock_connections = self.patch_connections.start()
        self.mock_elasticsearch = self.patch_elasticsearch.start()

        self.addCleanup(self.patch_setup.stop)
        self.addCleanup(self.patch_connections.stop)
        self.addCleanup(self.patch_elasticsearch.stop)

    @patch("designsafe.apps.data.management.commands.swap_reindex.Command.handle")
    def test_working(self, mock_handle):
        mock_handle.return_value = "OK"
        opts = {"index": "files"}
        call_command("swap_reindex", **opts)
        self.assertEqual(mock_handle.call_count, 1)

    @patch("designsafe.apps.data.management.commands.swap_reindex.input")
    def test_raises_when_user_does_not_proceed(self, mock_input):
        mock_input.return_value = "n"
        opts = {"index": "files"}
        with self.assertRaises(SystemExit):
            call_command("swap_reindex", **opts)

    @patch("designsafe.apps.data.management.commands.swap_reindex.Index")
    @patch("designsafe.apps.data.management.commands.swap_reindex.input")
    def test_raises_exception_when_no_index(self, mock_input, mock_index):
        mock_input.return_value = "Y"

        mock_index.return_value.get_alias.return_value.keys.side_effect = Exception
        opts = {"index": "files"}

        with self.assertRaises(SystemExit):
            call_command("swap_reindex", **opts)

    @patch("designsafe.apps.data.management.commands.swap_reindex.Index")
    @patch("designsafe.apps.data.management.commands.swap_reindex.input")
    def test_performs_reindex_from_default_to_reindex(self, mock_input, mock_index):
        mock_input.return_value = "Y"

        mock_index.return_value.get_alias.return_value.keys.side_effect = [
            ["DEFAULT_NAME"],
            ["REINDEX_NAME"],
        ]
        opts = {"index": "files"}

        mock_client = MagicMock()
        self.mock_elasticsearch.Elasticsearch.return_value = mock_client

        call_command("swap_reindex", **opts)

        self.mock_elasticsearch.helpers.reindex.assert_called_with(
            mock_client, "DEFAULT_NAME", "REINDEX_NAME"
        )

    @patch("designsafe.apps.data.management.commands.swap_reindex.Index")
    @patch("designsafe.apps.data.management.commands.swap_reindex.input")
    def test_performs_swap_with_correct_args(self, mock_input, mock_index):
        mock_input.return_value = "Y"

        mock_index.return_value.get_alias.return_value.keys.side_effect = [
            ["DEFAULT_NAME"],
            ["REINDEX_NAME"],
        ]
        opts = {"index": "files"}

        call_command("swap_reindex", **opts)

        mock_alias = {
            "actions": [
                {"remove": {"index": "DEFAULT_NAME", "alias": "designsafe-dev-files"}},
                {
                    "remove": {
                        "index": "REINDEX_NAME",
                        "alias": "designsafe-dev-files-reindex",
                    }
                },
                {
                    "add": {
                        "index": "DEFAULT_NAME",
                        "alias": "designsafe-dev-files-reindex",
                    }
                },
                {"add": {"index": "REINDEX_NAME", "alias": "designsafe-dev-files"}},
            ]
        }
        self.mock_elasticsearch.Elasticsearch().indices.update_aliases.assert_called_with(
            mock_alias
        )

    @patch("designsafe.apps.data.management.commands.swap_reindex.Index")
    @patch("designsafe.apps.data.management.commands.swap_reindex.input")
    def test_cleanup(self, mock_input, mock_index):
        mock_input.return_value = "Y"

        mock_index.return_value.get_alias.return_value.keys.side_effect = [
            ["DEFAULT_NAME"],
            ["REINDEX_NAME"],
            ["REINDEX_NAME"],
        ]
        opts = {"index": "files", "cleanup": True}

        call_command("swap_reindex", **opts)

        self.assertEqual(mock_index.return_value.delete.call_count, 1)
