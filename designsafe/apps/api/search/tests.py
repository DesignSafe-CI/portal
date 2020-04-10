from mock import patch
from django.test import TestCase
from django.core.urlresolvers import reverse

class SearchViewTests(TestCase):

    @patch('designsafe.apps.api.search.views.CommunityDataSearchManager')
    @patch('designsafe.apps.api.search.views.PublishedDataSearchManager')
    @patch('designsafe.apps.api.search.views.CMSSearchManager')
    @patch('designsafe.apps.api.search.views.PublicationsSearchManager')
    @patch('designsafe.apps.api.search.views.Search')
    @patch('designsafe.apps.api.search.views.Index')
    def test_search_view(self, mock_index, mock_search, mock_community, mock_published, mock_cms, mock_publications):

        mock_index().alias().keys.side_effect = [['test-pub'], ['test-pub-legacy'], ['test-files'], ['test-cms']]
        mock_search().query().count.return_value = 0
        mock_search().query().highlight().highlight_options().execute().return_value = []
        mock_search().query().highlight().highlight_options().execute().hits.total.value = 0
        url = "{}?type_filter=all&query_string=test".format(reverse('designsafe_api:ds_search_api:search'))

        response = self.client.get(url)

        self.assertEqual(response.json(), {'hits': [],
                                           'public_files_total': 0,
                                           'published_total': 0,
                                           'cms_total': 0,
                                           'total_hits': 0,
                                           'all_total': 0})

