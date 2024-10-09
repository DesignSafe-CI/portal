class SetupState:
    # Steps in PENDING will be have their process methods called
    # by portal.apps.onboarding.execute.execute_setup_steps
    PENDING = "pending"

    # Steps in PROCESSING have had their process methods invoked
    # by portal.apps.onboarding.execute.execute_setup_steps
    PROCESSING = "processing"

    # Steps in FAILED state will display as a failure in the client
    # They may be set to FAILED by calling the fail method
    FAILED = "failed"

    # Steps in COMPLETED state will cause the next step to be
    # checked for automated processing
    # by portal.apps.onboarding.execute.execute_setup_steps
    COMPLETED = "completed"

    # Steps in USERWAIT state will show a Confirm button in the
    # client to the user, allowing them to confirm an action.
    # Once they have pressed the Confirm button, the client
    # will send "user_confirm" to the step's client_action method
    USERWAIT = "userwait"

    # Steps in STAFFWAIT state will show an "Approve" and "Deny"
    # action to staff users, allowing them to approve or deny
    # a portal onboarding step. The client will send
    # "staff_approve" or "staff_deny" to the step's client_action method
    STAFFWAIT = "staffwait"

    # Steps in ERROR have been processed in execute_setup_steps but
    # generated an exception. This state will also cause the front end
    # to display a "submit a ticket" link to the user
    ERROR = "error"
