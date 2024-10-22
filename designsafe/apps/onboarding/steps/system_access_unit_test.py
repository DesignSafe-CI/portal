from django.conf import settings
from designsafe.apps.onboarding.steps.system_access import SystemAccessStep
import pytest
import json
import os


@pytest.fixture
def tas_client(mocker):
    with open(
        os.path.join(settings.BASE_DIR, "designsafe/fixtures/tas/tas_project.json")
    ) as f:
        tas_project = json.load(f)
    tas_client_mock = mocker.patch(
        "designsafe.apps.onboarding.steps.project_membership.TASClient", autospec=True
    )
    tas_client_mock.return_value.project.return_value = tas_project
    tas_client_mock.return_value.projects_for_user.return_value = [tas_project]
    yield tas_client_mock


@pytest.fixture
def mock_user_allocations(mocker):
    yield mocker.patch(
        "designsafe.apps.onboarding.steps.system_access.get_allocations", autospec=True
    )


@pytest.fixture
def system_access_step(settings, regular_user, tas_client, mock_user_allocations):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            "step": "designsafe.apps.onboarding.steps.system_access.SystemAccessStep",
            "settings": {
                "required_systems": [
                    "stampede2.tacc.utexas.edu",
                    "ls5.tacc.utexas.edu",
                ],
                "project_sql_id": 12345,
            },
        }
    ]
    step = SystemAccessStep(regular_user)
    yield step


def test_not_has_required_systems(system_access_step, mock_user_allocations):
    mock_user_allocations.return_value = {"hosts": {}}
    assert not system_access_step.has_required_systems()
