from django.http.response import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import logging


logger = logging.getLogger(__name__)


@csrf_exempt
def box_webhook(request):
    """
    Webhook to receive event notifications from Box.com when users operate on their
    Box.com account outside of the CI. Box.com POSTs a JSON event description such as the
    following:

    {
        "event_type": string; one of
                      ["created", "uploaded", "moved", "copied", "deleted"],
        "item_id": int,
        "item_type": string,
        "item_name": string,
        "item_extension": string; only for item_type=="file",
        "parent_folder_id": int,
        "from_user_id": user id who performed action,
        "to_user_ids": array of user ids
    }

    Currently supported event_types: [uploaded, moved, copied, deleted]


    Args:
        request: the Django request; Box.com POSTs a JSON event description to this
                 endpoint

    Returns:
        None

    """
    if request.method == 'POST':
        logger.debug(request.body)
    return HttpResponse('OK')
