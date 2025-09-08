from django.test import Client
from django.contrib.auth.models import User
from django.urls import reverse
from django.db import Error as DatabaseError
from unittest.mock import patch
import pytest
import json

pytestmark = pytest.mark.django_db


@pytest.fixture
def authenticated_user():
    """Create and return an authenticated user for testing"""
    user = User.objects.create_user(username="testuser", password="testpass")
    return user


@pytest.fixture
def authenticated_client(authenticated_user):
    """Create a client with an authenticated user"""
    client = Client()
    client.login(username="testuser", password="testpass")
    return client


def test_audit_trail_page_loads(authenticated_client):
    """Test that the audit trail page loads correctly when user is logged in"""
    response = authenticated_client.get(reverse("designsafe_audit:audit_trail"))
    assert response.status_code == 200
    assert "Audit Trail" in response.content.decode()


def test_audit_trail_requires_login(authenticated_user):
    """Test that the audit trail page requires authentication"""
    client = Client()  # not logged in yet
    response = client.get(reverse("designsafe_audit:audit_trail"))
    assert response.status_code == 302  # redirected to login
    assert "login" in response.url


# when search happens for username that dosen't exist
def test_portal_search_returns_empty_data(authenticated_client):
    """Test that portal search returns empty data when username is not found in database"""
    with patch("designsafe.apps.audit.views.connections") as mock_connections:
        mock_audit_db = mock_connections.__getitem__.return_value
        mock_cursor = mock_audit_db.cursor.return_value
        mock_cursor.fetchall.return_value = []

        response = authenticated_client.get(
            reverse(
                "designsafe_audit:get_portal_audit_search",
                kwargs={"username": "invalidUser"},
            )
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"] == []


# when search happens for a file that dosen't exist - need to implement get_tapis_files_audit_search fn in views.py
# don't need mock because return value hardcoded in views.py
def test_tapis_files_audit_search_returns_empty_data(authenticated_client):
    """Test that tapis files search returns empty data structure when no data exists"""
    response = authenticated_client.get(
        reverse(
            "designsafe_audit:get_tapis_files_audit_search",
            kwargs={"filename": "test.txt"},
        )
    )
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert data["data"] == []


def test_usernames_portal_endpoint(authenticated_client):
    """Test that the usernames endpoint returns a list of usernames"""
    with patch("designsafe.apps.audit.views.connections") as mock_connections:
        mock_audit_db = mock_connections.__getitem__.return_value
        mock_cursor = mock_audit_db.cursor.return_value
        mock_cursor.fetchall.return_value = []

        response = authenticated_client.get(
            reverse("designsafe_audit:get_usernames_portal")
        )
        assert response.status_code == 200
        data = response.json()
        assert "usernames" in data
        assert isinstance(data["usernames"], list)


def test_portal_search_handles_database_error(authenticated_client):
    """Test that portal search handles database connection errors gracefully"""
    with patch("designsafe.apps.audit.views.connections") as mock_connections:
        # mock the database connection to raise an errorr
        mock_connections.__getitem__.side_effect = DatabaseError(
            "Database connection failed"
        )

        response = authenticated_client.get(
            reverse(
                "designsafe_audit:get_portal_audit_search",
                kwargs={"username": "testuser"},
            )
        )
        assert response.status_code == 500
        data = response.json()
        assert "error" in data


# NEED TO REDO ALL OF THIS, UPDATED VIEWS AND URLS FILES IN NEXT COMMIT, CURRENTLY NOT WOKRING
