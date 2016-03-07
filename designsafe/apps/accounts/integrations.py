from django.conf import settings
from django.utils.importlib import import_module
import logging


logger = logging.getLogger(__name__)


def get_integrations():
    app_integrations = []

    for app in settings.INSTALLED_APPS:
        try:
            mod = import_module('%s.integrations' % app)
            try:
                app_integrations += mod.provide_integrations()
            except AttributeError:
                continue
            except:
                logger.warning('Call to module.provide_integrations fail for module: %s' % mod.__name__)
        except:
            continue

    return app_integrations

