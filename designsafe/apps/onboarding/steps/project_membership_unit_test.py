from django.conf import settings
from portal.apps.onboarding.steps.project_membership import ProjectMembershipStep
from portal.apps.onboarding.models import SetupEvent
from mock import MagicMock, ANY
import pytest
import json
import os


@pytest.fixture
def tas_client(mocker):
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_project.json')) as f:
        tas_project = json.load(f)
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_project_users.json')) as f:
        tas_project_users = json.load(f)
    tas_client_mock = mocker.patch('portal.apps.onboarding.steps.project_membership.TASClient', autospec=True)
    tas_client_mock.return_value.project.return_value = tas_project
    tas_client_mock.return_value.get_project_users.return_value = tas_project_users
    yield tas_client_mock


@pytest.fixture
def mock_rt(mocker):
    mock_tracker = mocker.patch(
        'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.get_tracker'
    )
    mock_tracker.return_value.login.return_value = True
    yield mock_tracker


@pytest.fixture
def project_membership_step(settings, regular_user, tas_client, mock_rt):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep',
            'settings': {
                'project_sql_id': 12345
            }
        }
    ]
    step = ProjectMembershipStep(regular_user)
    yield step


@pytest.fixture
def project_membership_step_with_userlink(settings, regular_user, tas_client):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep',
            'settings': {
                'project_sql_id': 12345,
                'userlink': {
                    'url': '/',
                    'text': 'Request Access'
                },
            },
            'retry': True
        }
    ]
    step = ProjectMembershipStep(regular_user)
    yield step


@pytest.fixture
def project_membership_log(mocker):
    yield mocker.patch.object(ProjectMembershipStep, 'log')


@pytest.fixture
def project_membership_fail(mocker):
    yield mocker.patch.object(ProjectMembershipStep, 'fail')


@pytest.fixture
def project_membership_complete(mocker):
    yield mocker.patch.object(ProjectMembershipStep, 'complete')


def test_is_project_member(tas_client, project_membership_step):
    assert project_membership_step.is_project_member()
    tas_client.return_value.get_project_users.return_value = []
    assert not project_membership_step.is_project_member()


def test_process_user_is_member(monkeypatch, project_membership_step, project_membership_complete):
    def mock_is_project_member():
        return True
    monkeypatch.setattr(project_membership_step, 'is_project_member', mock_is_project_member)
    project_membership_step.process()
    project_membership_complete.assert_called_with(
        "You have the required project membership to access this portal."
    )


def test_process_user_is_not_member(monkeypatch, project_membership_step, project_membership_log):
    def mock_is_project_member():
        return False
    monkeypatch.setattr(project_membership_step, 'is_project_member', mock_is_project_member)
    project_membership_step.process()
    project_membership_log.assert_called_with(
        "Please confirm your request to use this portal.",
        data=None
    )


def test_process_userlink(monkeypatch, project_membership_step_with_userlink, project_membership_log):
    def mock_is_project_member():
        return False
    monkeypatch.setattr(project_membership_step_with_userlink, 'is_project_member', mock_is_project_member)
    project_membership_step_with_userlink.process()
    project_membership_log.assert_called_with(
        "Please confirm your request to use this portal.",
        data={
            'userlink': {
                'url': '/',
                'text': 'Request Access'
            }
        }
    )


def test_send_project_request(rf, project_membership_step, project_membership_log, mock_rt, regular_user):
    request = rf.get("https://cep.dev/")
    request.user = regular_user
    project_membership_step.send_project_request(request)
    mock_rt.return_value.create_ticket.assert_called()


def test_add_to_project(regular_user, project_membership_step, tas_client):
    project_membership_step.add_to_project()
    tas_client.return_value.add_project_user.assert_called_with(
        12345,
        regular_user.username
    )


def test_close_project_request(regular_user, project_membership_step, mock_rt):
    project_membership_step.events = [
        SetupEvent(user=regular_user),
        SetupEvent(user=regular_user, data={}),
        SetupEvent(user=regular_user, data={"ticket": "1234"}),
        SetupEvent(user=regular_user, data={"ticket": "12345"})
    ]
    project_membership_step.close_project_request()
    mock_rt.return_value.reply.assert_called_with("12345", text=ANY)
    mock_rt.return_value.comment.assert_called_with("12345", text=ANY)
    mock_rt.return_value.edit_ticket.assert_called_with("12345", Status='resolved')


def test_client_action(regular_user, rf, monkeypatch, project_membership_step, project_membership_complete):
    request = rf.get("/api/onboarding")
    request.user = regular_user
    mock_send = MagicMock()
    mock_add = MagicMock()
    mock_close = MagicMock()
    monkeypatch.setattr(project_membership_step, 'send_project_request', mock_send)
    monkeypatch.setattr(project_membership_step, 'add_to_project', mock_add)
    monkeypatch.setattr(project_membership_step, 'close_project_request', mock_close)
    project_membership_step.client_action("user_confirm", {}, request)
    mock_send.assert_called_with(request)
    request.user.is_staff = True
    project_membership_step.client_action("staff_approve", {}, request)
    mock_add.assert_called_with()
    mock_close.assert_called_with()
    project_membership_complete.assert_called_with(ANY)


def test_client_action_fail(rf, regular_user, monkeypatch, project_membership_step, project_membership_fail):
    mock_add = MagicMock(side_effect=Exception("Mock exception", "Mock reason"))
    monkeypatch.setattr(project_membership_step, 'add_to_project', mock_add)
    request = rf.get("/api/onboarding")
    request.user = regular_user
    request.user.is_staff = True
    project_membership_step.client_action("staff_approve", {}, request)
    project_membership_fail.assert_called_with(
        "An error occurred while trying to add this user to the project"
    )
