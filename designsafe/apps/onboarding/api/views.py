""""API views for the Onboarding app."""

import logging
import json
import math
from django.conf import settings
from django.http import (
    Http404,
    JsonResponse,
    HttpResponseBadRequest,
)
from django.contrib.auth import get_user_model
from django.contrib.admin.views.decorators import staff_member_required
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from django.utils.decorators import method_decorator
from designsafe.apps.api.views import AuthenticatedApiView
from designsafe.apps.api.users.utils import q_to_model_queries
from designsafe.apps.onboarding.models import SetupEvent, SetupEventEncoder
from designsafe.apps.onboarding.execute import (
    log_setup_state,
    load_setup_step,
    execute_single_step,
    execute_setup_steps,
)
from designsafe.apps.onboarding.state import SetupState

logger = logging.getLogger(__name__)


def get_user_onboarding(user):
    """Get a user's onboarding status"""
    # Result dictionary for user
    result = {
        "username": user.username,
        "lastName": user.last_name,
        "firstName": user.first_name,
        "email": user.email,
        "isStaff": user.is_staff,
        "steps": [],
        "setupComplete": user.profile.setup_complete,
    }

    # Populate steps list in result dictionary, in order of
    # steps as listed in PORTAL_USER_ACCOUNT_SETUP_STEPS
    account_setup_steps = getattr(settings, "PORTAL_USER_ACCOUNT_SETUP_STEPS", [])
    for step in account_setup_steps:
        # Get step events in descending order of time
        step_events = (
            SetupEvent.objects.all()
            .filter(user=user, step=step["step"])
            .order_by("-time")
        )

        step_instance = load_setup_step(user, step["step"])

        # Upon retrieving step data such as viewing the Onboarding page,
        # If a step has the 'retry' setting set to True and the step is not completed,
        # retry the step with asynchronous processing.
        if (
            "retry" in step
            and step["retry"]
            and step_instance.state != SetupState.PENDING
            and step_instance.state != SetupState.COMPLETED
        ):
            step_instance.state = SetupState.PROCESSING
            execute_single_step.apply_async(args=[user.username, step["step"]])
            logger.info("Retrying setup step %s for %s", step["step"], user.username)

        step_data = {
            "step": step["step"],
            "displayName": step_instance.display_name(),
            "description": step_instance.description(),
            "userConfirm": step_instance.user_confirm,
            "staffApprove": step_instance.staff_approve,
            "staffDeny": step_instance.staff_deny,
            "state": step_instance.state,
            "events": list(step_events),
            "data": None,
        }
        custom_status = step_instance.custom_status()
        if custom_status:
            step_data["customStatus"] = custom_status

        if step_instance.last_event:
            step_data["data"] = step_instance.last_event.data

        # Append all events. SetupEventEncoder will serialize
        # SetupEvent objects later
        result["steps"].append(step_data)

    return result


class SetupStepView(AuthenticatedApiView):
    """View for managing user setup steps"""

    def _get_user_parameter(self, request, username):
        """
        Validate request for action on a username

        Staff should be able to act on any user, but non-staff users
        should only be able to act on themselves.
        """
        # A user should only be able to retrieve info about themselves.
        # A staff member should be able to retrieve anyone.
        if username != request.user.username and not request.user.is_staff:
            raise PermissionDenied

        user = None
        try:
            user = get_user_model().objects.get(username=username)
        except get_user_model().DoesNotExist as exc:
            raise Http404 from exc

        return user

    def get(self, request, username=None):
        """
        View for returning a user's setup step events.

        Result structure will be:

        {
            ...
            user info
            ...
            "setupComplete" : true | false,
            "steps" : [
                {
                    "step" : "step1",
                    "state" : "pending",
                    "events" : [
                        SetupEvent, SetupEvent...
                    ]
                },
                ...
            ]
        }

        Where step dictionaries are in matching order of PORTAL_USER_ACCOUNT_SETUP_STEPS
        """
        if username is None:
            username = request.user.username

        user = self._get_user_parameter(request, username)

        result = get_user_onboarding(user)

        return JsonResponse(
            {
                "status": 200,
                "response": result,
            },
            encoder=SetupEventEncoder,
        )

    def complete(self, request, setup_step):
        """
        Move any step to COMPLETED
        """
        if not request.user.is_staff:
            raise PermissionDenied
        setup_step.state = SetupState.COMPLETED
        setup_step.log(
            f"{setup_step.display_name()} marked complete by {request.user.username}"
        )

    def reset(self, request, setup_step):
        """
        Call prepare() for the step. This should set it to its initial state.
        """
        if not request.user.is_staff:
            raise PermissionDenied
        setup_step.log(f"{setup_step.display_name()} reset by {request.user.username}")

        # Mark the user's setup_complete as False
        setup_step.user.profile.setup_complete = False
        setup_step.user.profile.save()
        log_setup_state(
            setup_step.user,
            f"{setup_step.user.username} setup marked incomplete, due to reset of {setup_step.step_name()}",
        )
        setup_step.prepare()

    def client_action(self, request, setup_step, action, data):
        """
        Call client_action on a setup step
        """
        setup_step.log(
            f"{action} action on {setup_step.step_name()} by {request.user.username}"
        )
        setup_step.client_action(action, data, request)

    def post(self, request, username):
        """
        Action handler for manipulating a user's setup step state.
        POST data from the client includes:

        {
            "action" : "staff_approve" | "staff_deny" | "user_confirm" |
                            "set_state" | "reset"
            "step" : SetupStep module and classname,
            "data" : an optional dictionary of data to send to the action
        }

        ..return: A JsonResponse with the last_event for the user's SetupStep,
                    reflecting state change
        """
        if username is None:
            username = request.user.username

        # Get the user object requested in the route parameter
        user = self._get_user_parameter(request, username)

        # Get POST action data
        step_name = None
        action = None
        data = None

        try:
            request_data = json.loads(request.body)
            step_name = request_data["step"]
            action = request_data["action"]
            if "data" in request_data:
                data = request_data["data"]
        except (json.JSONDecodeError, KeyError):
            logger.exception("Error parsing POST data")
            return HttpResponseBadRequest()

        # Instantiate the step instance requested by the POST, from the SetupEvent model.
        setup_step = load_setup_step(user, step_name)

        # Call action handler
        if action == "reset":
            self.reset(request, setup_step)
        elif action == "complete":
            self.complete(request, setup_step)
        else:
            self.client_action(request, setup_step, action, data)

        # If no exception was generated from any of the above actions, continue.
        # Retry executing the setup queue for this user
        execute_setup_steps.apply_async(args=[user.username])

        # Serialize and send back the last event on this step
        return JsonResponse(
            {
                "status": 200,
                "response": setup_step.last_event,
            },
            encoder=SetupEventEncoder,
        )


@method_decorator(staff_member_required, name="dispatch")
class SetupAdminView(AuthenticatedApiView):
    """Admin view for managing user setup steps"""

    # pylint: disable=too-many-locals
    def get(self, request):
        """Get all users for page and their setup steps"""

        page = int(request.GET.get("page", 1))
        limit = int(request.GET.get("limit", 20))
        show_incomplete_only = request.GET.get("showIncompleteOnly", "False").lower()
        query = request.GET.get("q", None)
        users = []
        filter_args = {}

        # Filter users based on the showIncompleteOnly parameter
        if show_incomplete_only == "true":
            filter_args["profile__setup_complete"] = False

        # Get users, with most recently joined users that do not have setup_complete, first
        if query:
            query = q_to_model_queries(query)
            results = (
                get_user_model()
                .objects.filter(query, **filter_args)
                .order_by(
                    "-date_joined", "profile__setup_complete", "last_name", "first_name"
                )
            )
        else:
            results = (
                get_user_model()
                .objects.filter(**filter_args)
                .order_by(
                    "-date_joined", "profile__setup_complete", "last_name", "first_name"
                )
            )

        # Uncomment this line to simulate many user results
        # results = list(results) * 105

        total = math.ceil(len(results) / limit)
        offset = (page - 1) * limit
        page = results[offset : limit * page]
        account_setup_steps = getattr(settings, "PORTAL_USER_ACCOUNT_SETUP_STEPS", [])

        # Assemble an array with the User data we care about
        for user in page:
            try:
                users.append(get_user_onboarding(user))
            except ObjectDoesNotExist as err:
                # If a user does not have a DesignSafeProfile, skip it
                logger.info(err)

        response = {
            "users": users,
            "total": total,
            "totalSteps": len(account_setup_steps),
        }

        return JsonResponse(
            {
                "status": 200,
                "response": response,
            },
            encoder=SetupEventEncoder,
        )
