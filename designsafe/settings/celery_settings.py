"""
# Celery settings
"""
import os
from kombu import Exchange, Queue
#CELERY_BROKER_URL = 'redis://redis:6379/0'
CELERY_BROKER_URL_PROTOCOL = os.environ.get('CELERY_BROKER_URL_PROTOCOL', 'amqp://')
CELERY_BROKER_URL_USERNAME = os.environ.get('CELERY_BROKER_URL_USERNAME', 'username')
CELERY_BROKER_URL_PWD = os.environ.get('CELERY_BROKER_URL_PWD', 'pwd')
CELERY_BROKER_URL_HOST = os.environ.get('CELERY_BROKER_URL_HOST', 'localhost')
CELERY_BROKER_URL_PORT = os.environ.get('CELERY_BROKER_URL_PORT', '123')
CELERY_BROKER_URL_VHOST = os.environ.get('CELERY_BROKER_URL_VHOST', 'vhost')
CELERY_BROKER_URL = ''.join([CELERY_BROKER_URL_PROTOCOL, CELERY_BROKER_URL_USERNAME, ':',
                      CELERY_BROKER_URL_PWD, '@', CELERY_BROKER_URL_HOST, ':',
                      CELERY_BROKER_URL_PORT, '/', CELERY_BROKER_URL_VHOST])
#CELERY_BROKER_URL = 'amqp://designsafe:pwd@rabbitmq:5672//'
CELERY_RESULT_BACKEND_PROTOCOL = os.environ.get('CELERY_RESULT_BACKEND_PROTOCOL', 'redis://')
CELERY_RESULT_BACKEND_USERNAME = os.environ.get('CELERY_RESULT_BACKEND_USERNAME', 'username')
CELERY_RESULT_BACKEND_PWD = os.environ.get('CELERY_RESULT_BACKEND_PWD', 'pwd')
CELERY_RESULT_BACKEND_HOST = os.environ.get('CELERY_RESULT_BACKEND_HOST', 'localhost')
CELERY_RESULT_BACKEND_PORT = os.environ.get('CELERY_RESULT_BACKEND_PORT', '1234')
CELERY_RESULT_BACKEND_DB = os.environ.get('CELERY_RESULT_BACKEND_DB', '0')
CELERY_RESULT_BACKEND = ''.join([CELERY_RESULT_BACKEND_PROTOCOL,
                                 CELERY_RESULT_BACKEND_HOST, ':', CELERY_RESULT_BACKEND_PORT,
                                 '/', CELERY_RESULT_BACKEND_DB])

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_WORKER_LOG_FORMAT = '[DJANGO] $(processName)s %(levelname)s %(asctime)s %(module)s '\
                     '%(name)s.%(funcName)s:%(lineno)s: %(message)s'
#CELERY_ANOTATIONS = {'designsafe.apps.api.tasks.reindex_agave': {'time_limit': 60 * 15}}


CELERY_TASK_DEFAULT_EXCHANGE_TYPE = 'direct'
CELERY_TASK_QUEUES = (
    Queue('default', Exchange('default'), routing_key='default'),
    #Use to queue indexing tasks
    Queue('indexing', Exchange('io'), routing_key='io.indexing'),
    #Use to queue tasks which handle files
    Queue('files', Exchange('io'), routing_key='io.files'),
    #Use to queue tasks which mainly call external APIs
    Queue('api', Exchange('api'), routing_key='api.agave'),
    # Use to queue tasks which handle user onboarding
    Queue('onboarding', Exchange('onboarding'), routing_key='onboarding'),
    )
CELERY_TASK_DEFAULT_QUEUE = 'default'
CELERY_TASK_DEFAULT_EXCHANGE = 'default'
CELERY_TASK_DEFAULT_ROUTING_KEY = 'default'
