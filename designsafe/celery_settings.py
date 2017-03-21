"""
# Celery settings
"""
import os
#BROKER_URL = 'redis://redis:6379/0'
BROKER_URL_PROTOCOL = os.environ.get('BROKER_URL_PROTOCOL')
BROKER_URL_USERNAME = os.environ.get('BROKER_URL_USERNAME')
BROKER_URL_PWD = os.environ.get('BROKER_URL_PWD')
BROKER_URL_HOST = os.environ.get('BROKER_URL_HOST')
BROKER_URL_PORT = os.environ.get('BROKER_URL_PORT')
BROKER_URL_VHOST = os.environ.get('BROKER_URL_VHOST')
BROKER_URL = ''.join([BROKER_URL_PROTOCOL, BROKER_URL_USERNAME, ':',
                      BROKER_URL_PWD, '@', BROKER_URL_HOST, ':',
                      BROKER_URL_PORT, '/', BROKER_URL_VHOST])
#BROKER_URL = 'amqp://designsafe:pwd@rabbitmq:5672//'
CELERY_RESULT_BACKEND_PROTOCOL = os.environ.get('CELERY_RESULT_BACKEND_PROTOCOL')
CELERY_RESULT_BACKEND_USERNAME = os.environ.get('CELERY_RESULT_BACKEND_USERNAME')
CELERY_RESULT_BACKEND_PWD = os.environ.get('CELERY_RESULT_BACKEND_PWD')
CELERY_RESULT_BACKEND_HOST = os.environ.get('CELERY_RESULT_BACKEND_HOST')
CELERY_RESULT_BACKEND_PORT = os.environ.get('CELERY_RESULT_BACKEND_PORT')
CELERY_RESULT_BACKEND_DB = os.environ.get('CELERY_RESULT_BACKEND_DB')
CELERY_RESULT_BACKEND = ''.join([CELERY_RESULT_BACKEND_PROTOCOL, CELERY_RESULT_BACKEND_USERNAME,
                                 ':', CELERY_RESULT_BACKEND_PWD, '@',
                                 CELERY_RESULT_BACKEND_HOST, ':', CELERY_RESULT_BACKEND_PORT,
                                 '/', CELERY_RESULT_BACKEND_DB])

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERYD_HIJACK_ROOT_LOGGER = False
CELERYD_LOG_FORMAT = '[DJANGO] $(processName)s %(levelname)s %(asctime)s %(module)s '\
                     '%(name)s.%(funcName)s:%(lineno)s: [%(task_name)s(%(task_id)s)]%(message)s'
#CELERY_ANOTATIONS = {'designsafe.apps.api.tasks.reindex_agave': {'time_limit': 60 * 15}}
