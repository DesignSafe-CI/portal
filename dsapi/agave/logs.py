import logging as logs

default_formatter = '[DJANGO] [%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s'

def get_logger(name, **kwargs):
    """
    Function to create and configure logger for API. This is because these APIs shouldn't use Django's loggers. We probably need a loggin_config.py or something like that for the APIs
    """
    logger = logs.getLogger(name)
    logger.setLevel(kwargs.get('level', logs.DEBUG))
    handler = kwargs.get('handler', logs.StreamHandler())
    formatter = kwargs.get('formatter', logs.Formatter(default_formatter))
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger
