from designsafe.apps.onboarding.steps.allocation import AllocationStep
from mock import ANY
import pytest


@pytest.fixture
def get_allocations_mock(mocker):
    get_allocations = mocker.patch(
        "designsafe.apps.onboarding.steps.allocation.get_allocations"
    )
    get_allocations.return_value = {
        "hosts": {"allocation": []},
    }
    yield get_allocations


@pytest.fixture
def get_allocations_failure_mock(mocker):
    get_allocations = mocker.patch(
        "designsafe.apps.onboarding.steps.allocation.get_allocations"
    )
    get_allocations.return_value = {
        "hosts": {},
    }
    yield get_allocations


@pytest.fixture
def allocation_step_complete_mock(mocker):
    yield mocker.patch.object(AllocationStep, "complete")


@pytest.fixture
def allocation_step_log_mock(mocker):
    yield mocker.patch.object(AllocationStep, "log")


def test_get_allocations(
    regular_user, get_allocations_mock, allocation_step_complete_mock
):
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_mock.assert_called_with(regular_user, force=True)
    allocation_step_complete_mock.assert_called_with(
        "Allocations retrieved",
        data={
            "hosts": {"allocation": []},
        },
    )


def test_get_allocations_failure(
    regular_user, get_allocations_failure_mock, allocation_step_log_mock
):
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_failure_mock.assert_called_with(regular_user, force=True)
    allocation_step_log_mock.assert_called_with(ANY)
