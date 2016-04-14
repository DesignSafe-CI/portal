from django.http.response import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .tasks import handle_box_webhook_event
import logging
import json
import ast

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["GET", "POST"])
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
    try:
        if request.method == 'POST':
            if request.META['CONTENT_TYPE'] == 'application/json':
                event_data = json.loads(request.body)
            else:
                event_data = request.POST.copy()
                # to_user_ids is a list as string
                event_data['to_user_ids'] = ast.literal_eval(event_data['to_user_ids'])
        else:
            event_data = request.GET.copy()
            # to_user_ids is a list as string
            event_data['to_user_ids'] = ast.literal_eval(event_data['to_user_ids'])

        logger.debug('Received Box Webhook; event_data=%s' % event_data)
        handle_box_webhook_event.apply_async(args=(event_data,))
    except AttributeError:
        pass
    except KeyError:
        pass
    return HttpResponse('OK')
