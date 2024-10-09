from portal.apps.onboarding.steps.mfa import MFAStep
import pytest


@pytest.fixture
def mock_mfa_check(mocker):
    yield mocker.patch('portal.apps.onboarding.steps.mfa_unit_test.MFAStep.mfa_check', autospec=True)


@pytest.fixture
def mock_mfa_log(mocker):
    yield mocker.patch.object(MFAStep, 'log')


@pytest.fixture
def mock_mfa_complete(mocker):
    yield mocker.patch.object(MFAStep, 'complete')


@pytest.fixture
def mock_mfa_prepare(mocker):
    yield mocker.patch.object(MFAStep, 'prepare')


def test_mfa_found(authenticated_user, mock_mfa_check, mock_mfa_complete):
    mock_mfa_check.return_value = True
    step = MFAStep(authenticated_user)
    step.process()
    mock_mfa_complete.assert_called_with(
        "Multi-factor authentication pairing verified"
    )


def test_mfa_not_found(mocker, authenticated_user, mock_mfa_check, mock_mfa_log):
    step = MFAStep(authenticated_user)
    mock_mfa_check.return_value = False
    step.process()
    mock_mfa_log.assert_called_with(mocker.ANY)


def test_mfa_check(authenticated_user, requests_mock):
    step = MFAStep(authenticated_user)
    requests_mock.get(step.tas_pairings_url(), json={"result": [{"type": "tacc-soft-token"}]})
    result = step.mfa_check()
    assert result is True


def test_mfa_check_failure(authenticated_user, requests_mock):
    step = MFAStep(authenticated_user)
    requests_mock.get(step.tas_pairings_url(), json={"result": []})
    result = step.mfa_check()
    assert result is False


def test_client_action(rf, authenticated_user, mock_mfa_prepare):
    step = MFAStep(authenticated_user)
    request = rf.post("/api/onboarding/user/test")
    request.user = authenticated_user
    step.client_action("user_confirm", {}, request)
    mock_mfa_prepare.assert_called_with()
