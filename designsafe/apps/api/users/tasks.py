""" Celery tasks for users api """

from celery import shared_task
from .utils import _get_latest_allocations


@shared_task(bind=True, max_retries=3, queue="indexing")
def cache_allocations(_, username):
    """
    Refreshes allocations cache
    """
    _get_latest_allocations(username)
