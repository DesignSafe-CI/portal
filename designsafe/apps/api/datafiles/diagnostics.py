# yourapp/diagnostics.py
import logging
import sys

from django.core.signals import got_request_exception
from django.dispatch import receiver

logger = logging.getLogger("request_diagnostics")


@receiver(
    got_request_exception,
    dispatch_uid="log_uncaught_request_exception",
)
def log_uncaught_request_exception(sender, request, **kwargs):
    logger.error(
        "Uncaught request exception: method=%s path=%s",
        request.method,
        request.path,
        exc_info=sys.exc_info(),
    )