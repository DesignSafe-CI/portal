from __future__ import absolute_import
import logging
import os

from celery import Celery
from celery.schedules import crontab

logger = logging.getLogger(__name__)

# set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'designsafe.settings')


from django.conf import settings  # noqa

app = Celery('designsafe')

# Using a string here means the worker will not have to
# pickle the object when using Windows.
app.config_from_object('django.conf:settings', namespace="CELERY")
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

app.conf.update(
    CELERYBEAT_SCHEDULE={
        'update_user_storages': {
            'task': 'designsafe.apps.search.tasks.update_search_index',
            'schedule': crontab(minute=0, hour=0),
        },
        'reindex_projects': {
            'task': 'designsafe.apps.api.tasks.reindex_projects',
            'schedule': crontab(hour=0, minute=0)
        }
    }
)

if settings.COMMUNITY_INDEX_SCHEDULE:
    app.conf.beat_schedule['index_community'] = {
        'task': 'designsafe.apps.search.tasks.index_community_data',
        'schedule': crontab(**settings.COMMUNITY_INDEX_SCHEDULE)
    }


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))
