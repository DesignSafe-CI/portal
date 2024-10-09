from mock import MagicMock
from django.http import JsonResponse
import json
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.api.views import (
    SetupStepView,
    get_user_onboarding
)
import pytest
import logging

logger = logging.getLogger(__name__)

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def mocked_executor(mocker):
    yield mocker.patch('portal.apps.onboarding.api.views.execute_setup_steps')


@pytest.fixture(autouse=True)
def mocked_log_setup_state(mocker):
    yield mocker.patch('portal.apps.onboarding.api.views.log_setup_state')


"""
SetupStepView tests
"""


def test_get_user(client, authenticated_user):
    response = client.get('/api/onboarding/user/{}/'.format(authenticated_user.username))
    assert response.status_code == 200
    result = json.loads(response.content)
    assert result["username"] == "username"


def test_get_user_unauthenticated_forbidden(client, regular_user):
    response = client.get('/api/onboarding/user/{}/'.format(regular_user.username))
    assert response.status_code == 302


def test_get_other_user_forbidden(client, authenticated_user, regular_user2):
    response = client.get('/api/onboarding/user/{}/'.format(regular_user2.username))
    assert response.status_code == 403


def test_get_user_as_staff(client, authenticated_staff, regular_user):
    response = client.get("/api/onboarding/user/{}/".format(regular_user.username))
    assert response.status_code == 200
    result = json.loads(response.content)
    assert result["username"] == regular_user.username
    assert len(result["steps"][0]["events"]) == 0


def test_get_user_as_staff_with_steps(settings, authenticated_staff, client, mock_steps):
    response = client.get("/api/onboarding/user/username", follow=True)
    result = response.json()

    # Make sure result json is correct.
    assert result["username"] == "username"
    assert len(result["steps"][0]["events"]) == 2


def test_get_non_existent_user_as_staff(client, authenticated_staff):
    response = client.get("/api/onboarding/user/non_existent_user/")
    assert response.status_code == 404


def test_get_user_as_user(client, settings, authenticated_user, mock_steps):
    # A user should be able to retrieve their own setup event info
    response = client.get("/api/onboarding/user/{}".format(authenticated_user.username), follow=True)
    result = response.json()

    result = json.loads(response.content)
    assert result["username"] == authenticated_user.username
    assert "steps" in result
    assert result["steps"][0]["step"] == 'portal.apps.onboarding.steps.test_steps.MockStep'
    assert result["steps"][0]["displayName"] == 'Mock Step'
    assert result["steps"][0]["state"] == SetupState.COMPLETED
    assert len(result["steps"][0]["events"]) == 2


def test_retry_step(client, settings, authenticated_user, mock_retry_step, mocker):
    mock_execute_single_step = mocker.patch("portal.apps.onboarding.api.views.execute_single_step")
    response = client.get("/api/onboarding/user/{}".format(authenticated_user.username), follow=True)
    mock_execute_single_step.apply_async.assert_called_with(args=[
        authenticated_user.username,
        'portal.apps.onboarding.steps.test_steps.MockStep'
    ])
    result = json.loads(response.content)
    assert result["username"] == authenticated_user.username
    assert "steps" in result
    assert result["steps"][0]["step"] == 'portal.apps.onboarding.steps.test_steps.MockStep'
    assert result["steps"][0]["state"] == SetupState.PROCESSING


def test_incomplete_post(client, authenticated_user):
    # post should return HttpResponseBadRequest (400) if fields are missing
    response = client.post(
        "/api/onboarding/user/{}/".format(authenticated_user),
        content_type="application/json",
        data=json.dumps({"action": "user_confirm"})
    )
    assert response.status_code == 400

    response = client.post(
        "/api/onboarding/user/{}/".format(authenticated_user),
        content_type="application/json",
        data=json.dumps({"step": "setupstep"})
    )
    assert response.status_code == 400


def test_client_action(regular_user, rf):
    view = SetupStepView()
    mock_step = MagicMock()
    mock_step.step_name.return_value = "Mock Step"
    request = rf.post("/api/onboarding/user/username")
    request.user = regular_user
    view.client_action(
        request,
        mock_step,
        "user_confirm",
        None
    )
    mock_step.log.assert_called()
    mock_step.client_action.assert_called_with(
        "user_confirm",
        None,
        request
    )


def test_reset_not_staff(client, authenticated_user):
    response = client.post(
        "/api/onboarding/user/{}/".format(authenticated_user.username),
        content_type='application/json',
        data=json.dumps({
            "action": "reset",
            "step": "portal.apps.onboarding.steps.test_steps.MockStep"
        })
    )
    assert response.status_code == 403


def test_reset(rf, staff_user, regular_user, mocked_log_setup_state):
    # The reset function should call prepare on a step
    # and flag the user's setup_complete as False
    view = SetupStepView()
    request = rf.post("/api/onboarding/user/username")
    request.user = staff_user
    mock_step = MagicMock()
    mock_step.user = regular_user

    # Call reset function
    view.reset(request, mock_step)

    mock_step.prepare.assert_called()
    mock_step.log.assert_called()
    mocked_log_setup_state.assert_called()
    assert not mock_step.user.profile.setup_complete


def test_complete_not_staff(client, authenticated_user, regular_user2):
    response = client.post("/api/onboarding/user/{}/".format(regular_user2))
    assert response.status_code == 403


def test_complete(client, authenticated_staff, regular_user, mock_steps, mocked_executor):
    response = client.post(
        "/api/onboarding/user/{}/".format(regular_user.username),
        content_type='application/json',
        data=json.dumps({
            "action": "complete",
            "step": "portal.apps.onboarding.steps.test_steps.MockStep"
        })
    )

    # set_state should have put MockStep in COMPLETED, as per request
    events = [event for event in SetupEvent.objects.all()]
    assert events[-1].step == "portal.apps.onboarding.steps.test_steps.MockStep"
    assert events[-1].state == SetupState.COMPLETED

    # execute_setup_steps should have been run
    mocked_executor.apply_async.assert_called_with(args=[regular_user.username])
    last_event = json.loads(response.content)
    assert last_event["state"] == SetupState.COMPLETED


"""
SetupAdminView tests
"""


def test_admin_route(client, authenticated_staff):
    # If the user is authenticated and is_staff, then the route should
    # return a JsonResponse
    response = client.get("/api/onboarding/admin/")
    assert isinstance(response, JsonResponse)


def test_admin_route_is_protected(authenticated_user, client):
    # Test to make sure route is protected
    # If the user is not staff, then the route should return a redirect to admin login
    response = client.get("/api/onboarding/admin/", follow=False)
    assert response.status_code == 302


def test_get_user_onboarding(mock_steps, regular_user):
    # Test retrieving a user's events
    result = get_user_onboarding(regular_user)
    assert result["steps"][0]["step"] == "portal.apps.onboarding.steps.test_steps.MockStep"


def test_get_no_profile(client, authenticated_staff, regular_user):
    # Test that no object is returned for a user with no profile
    regular_user.profile.delete()
    response = client.get("/api/onboarding/admin/")
    response_data = json.loads(response.content)

    # regular_user should not appear in results
    assert not any(
        [True for user in response_data['users'] if user['username'] == regular_user.username]
    )


def test_get(client, authenticated_staff, regular_user, mock_steps):
    regular_user.profile.setup_complete = False
    regular_user.profile.save()

    authenticated_staff.profile.setup_complete = True
    authenticated_staff.profile.save()

    # Make a request without 'showIncompleteOnly' parameter
    response = client.get("/api/onboarding/admin/")
    result = json.loads(response.content)

    users = result["users"]

    # Make a request with 'showIncompleteOnly' parameter set to true
    response_incomplete_users = client.get("/api/onboarding/admin/?showIncompleteOnly=true")
    result_incomplete_users = json.loads(response_incomplete_users.content)

    users_incomplete = result_incomplete_users["users"]

    # Assertions without 'showIncompleteOnly'
    # The first result should be the regular_user, since they have not completed setup
    assert users[0]["username"] == regular_user.username

    # User regular_user's last event should be MockStep
    assert users[0]['steps'][0]['step'] == "portal.apps.onboarding.steps.test_steps.MockStep"

    # There should be two users returned
    assert len(users) == 2

    # Assertions with 'showIncompleteOnly=true'
    assert users_incomplete[0]["username"] == regular_user.username
    assert users_incomplete[0]['steps'][0]['step'] == "portal.apps.onboarding.steps.test_steps.MockStep"

    # There should be one user since only one user has setup_complete = True
    assert len(users_incomplete) == 1


def test_get_search(client, authenticated_staff, regular_user, mock_steps):
    response = client.get("/api/onboarding/admin/?q=Firstname")
    result = json.loads(response.content)

    users = result["users"]

    # The first result should be the regular_user, since they have not completed setup
    assert users[0]["username"] == regular_user.username

    # User regular_user's last event should be MockStep
    assert users[0]['steps'][0]['step'] == "portal.apps.onboarding.steps.test_steps.MockStep"

    # There should be two users returned
    assert len(users) == 1
