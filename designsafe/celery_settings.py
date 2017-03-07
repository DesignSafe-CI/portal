###
# Celery settings
#
BROKER_URL = 'redis://redis:6379/0'
#BROKER_URL = 'amqp://designsafe:8WEESynT82y73qhG@rabbitmq:5672//'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERYD_LOG_FORMAT ='[DJANGO] $(processName)s %(levelname)s %(asctime)s %(module)s %(name)s.%(funcName)s:%(lineno)s: [%(task_name)s(%(task_id)s)]%(message)s'
#CELERY_ANOTATIONS = {'designsafe.apps.api.tasks.reindex_agave': {'time_limit': 60 * 15}}
CELERYD_TASK_TIME_LIMIT = 60 * 15 #60 seconds multiplied by 15 = 15min
