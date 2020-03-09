from django.test import TestCase
from mock import patch
from .views import redirect_old_nees

class RedirectTest(TestCase):
    """
    Assert that the redirect function is called 
    using a query string made with part of the NEES ID
    """
    @patch('django.shortcuts.redirect')
    def test_redirect_old_nees(self, mock_redirect):
        mock_redirect.return_value = True
        redirect_old_nees(685)
        self.assertTrue(mock_redirect.called_with('/search/?query_string=NEES 0685'))
